import { readFileSync } from "fs";
import { join } from "path";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageFunctionToolCall,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { computeRoute, type TravelMode } from "@/lib/google-routes/client";
import { geocodePlace, getWeather } from "@/lib/weather/client";

/** Route handler lifetime cap (seconds). Needed for multi-round tools + long streams on hosts like Vercel. Plan tier may cap lower than this. */
export const maxDuration = 300;

function resolveOpenAITimeoutMs(): number {
  const raw = process.env.OPENAI_TIMEOUT_MS?.trim();
  if (!raw) return 600_000;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 10_000 ? n : 600_000;
}

function isFunctionToolCall(
  tc: ChatCompletionMessageToolCall,
): tc is ChatCompletionMessageFunctionToolCall {
  return tc.type === "function";
}

const MAX_MESSAGES = 32;
const MAX_CONTENT_LENGTH = 12_000;
const MAX_TOOL_ROUNDS = 6;

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

function sanitizeMessages(raw: unknown): ClientMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ClientMessage[] = [];
  for (const item of raw) {
    if (out.length >= MAX_MESSAGES) break;
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: string }).role;
    const content = (item as { content?: string }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string" || content.length === 0) continue;
    out.push({ role, content: content.slice(0, MAX_CONTENT_LENGTH) });
  }
  return out;
}

// --- Mood ---

type MoodState = {
  energy: number;
  vibe: number;
  hunger: number;
};

function parseMood(raw: unknown): MoodState | null {
  if (!raw || typeof raw !== "object") return null;
  const { energy, vibe, hunger } = raw as Record<string, unknown>;
  if (
    typeof energy !== "number" ||
    typeof vibe !== "number" ||
    typeof hunger !== "number"
  )
    return null;
  const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));
  return { energy: clamp(energy), vibe: clamp(vibe), hunger: clamp(hunger) };
}

function buildMoodContext(mood: MoodState): string {
  const energyDesc =
    mood.energy <= 30
      ? "low (drained) — avoid stacking strenuous stops; suggest a café break, hammock time, or rest"
      : mood.energy <= 60
        ? "moderate — balance active and relaxed activities"
        : "high (energetic) — the traveller is ready for adventure";

  const vibeDesc =
    mood.vibe <= 30
      ? "low — keep things calm and restorative; skip loud or crowded venues"
      : mood.vibe <= 60
        ? "neutral — mix of chill and social options works"
        : "high (fresh, upbeat) — open to exciting, social, or novel experiences";

  const hungerDesc =
    mood.hunger <= 30
      ? "not hungry (just eaten) — no need to rush a meal stop"
      : mood.hunger <= 60
        ? "peckish — a snack or light warung stop within the next 1–2 hours would be welcome"
        : "quite hungry — prioritise a proper meal stop soon";

  return `## Current traveller mood (live, updates every turn)

The traveller has the following current mood values (0–100). Use them to tailor your recommendations:

- Energy: ${mood.energy} — ${energyDesc}.
- Vibe: ${mood.vibe} — ${vibeDesc}.
- Hunger: ${mood.hunger} — ${hungerDesc}.

If energy is low, prefer shorter routes and add rest points. If hunger is high, work a meal stop in early. If vibe is low, favour peaceful spots over busy nightlife.

## Mood projection (REQUIRED after activity plans)

Whenever your reply includes a multi-stop plan, day itinerary, or any sequence of activities the traveller would actually do:

1. **Inline meters:** On EVERY bold stop line (\`**emoji time — Place**\`) and EVERY route blockquote line (\`> 🚗 ... → **Place**\`), append \`sem-mood:E/V/H\` on that SAME line (after the place name) — three integers 0–100 for cumulative projected Energy, Vibe, and Hunger after completing that stop or after finishing that drive and arriving at the destination name in the quote.

2. **Summary block:** End the reply with EXACTLY ONE fenced \`semeton-mood\` block reporting the projected mood AFTER they finish the full planned sequence (must match the last inline \`sem-mood:E/V/H\` snapshot).

Use the heuristics below; clamp every value to 0–100.

\`\`\`semeton-mood
energy: 45
vibe: 85
hunger: 70
\`\`\`

Heuristics for projecting the new mood (apply each activity's effect cumulatively, then clamp 0–100):

- Beach / swim / surf / sunbathe: vibe +15, energy −20, hunger +15.
- Long drive (>45 min) or hike: energy −25, hunger +10, vibe −5.
- Short scooter ride (<20 min): energy −5.
- Temple / cultural / sightseeing: vibe +10, energy −10, hunger +10.
- Café / restaurant / proper meal: hunger drops to ~15, energy +10, vibe +5.
- Snack / warung quick bite: hunger −25, energy +5.
- Spa / yoga / massage / rest stop: energy +20, vibe +15, hunger +5.
- Nightlife / beach club / party: vibe +20 then −10 (net +10), energy −25, hunger +15.
- Waterfall / nature walk: vibe +15, energy −15, hunger +10.
- Shopping / markets: energy −10, hunger +10, vibe +5.

Rules for the \`semeton-mood\` block:
- Output ONLY the new absolute values (0–100), one per line, exactly the keys \`energy\`, \`vibe\`, \`hunger\`.
- Place the block at the very end of your reply, AFTER any maps link or \`semeton-weather\` block.
- Emit at most ONE \`semeton-mood\` block per reply.
- The numbers MUST match the last inline \`sem-mood:E/V/H\` token in that itinerary (the projected mood after the final stop or leg).
- For pure conversational replies (a single tip, a definition, a yes/no answer with no activities), do NOT emit the block or inline \`sem-mood:\` tokens.
- Never narrate mood percentages in prose ("your energy will drop to 45..."); only inline \`sem-mood:\` tokens and the final fenced block carry numeric mood values.`;
}

// --- Plan guide loading (module-level cache, read once per cold start) ---
let _planGuide: string | null = null;

function getPlanGuide(): string {
  if (_planGuide !== null) return _planGuide;
  try {
    const raw = readFileSync(join(process.cwd(), "docs/plan-guide.md"), "utf-8");
    // Strip reference markers like 【47†L537-L545】 that clutter the context
    _planGuide = raw.replace(/【[^\]]*】/g, "").trim();
  } catch {
    _planGuide = "";
  }
  return _planGuide;
}

// --- Tools ---
const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_travel_time",
      description:
        "Get the estimated driving (or walking/cycling) travel time and distance between two locations in Bali. Use this whenever you need accurate travel durations for an itinerary.",
      parameters: {
        type: "object",
        properties: {
          origin: {
            type: "string",
            description:
              'Starting location, e.g. "Ubud, Bali" or "Tanah Lot, Bali"',
          },
          destination: {
            type: "string",
            description:
              'Ending location, e.g. "Seminyak, Bali" or "Uluwatu Temple, Bali"',
          },
          travel_mode: {
            type: "string",
            enum: ["DRIVE", "TWO_WHEELER", "WALK", "BICYCLE"],
            description:
              "Mode of transport. Defaults to DRIVE. Use TWO_WHEELER for scooter.",
          },
        },
        required: ["origin", "destination"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description:
        "Get current weather conditions for one or more places in Bali. Call whenever the user asks about weather, packing advice, rain, temperature, or best season for a specific upcoming visit. Returns live temperature, conditions, humidity, and precipitation probability. IMPORTANT: do NOT call this tool more than once per assistant turn for the same place. If you already received a successful result for a place earlier in this same turn, use that result — do not request it again.",
      parameters: {
        type: "object",
        properties: {
          places: {
            type: "array",
            items: { type: "string" },
            description:
              'Place names to check, e.g. ["Ubud, Bali", "Seminyak, Bali"]. Limit to the most relevant stops.',
          },
        },
        required: ["places"],
      },
    },
  },
];

const BASE_SYSTEM_PROMPT = `You are Semeton, an expert Bali travel and itinerary planner.

Your job is to help travellers plan the perfect Bali trip — from one-day excursions to multi-week adventures. You know Bali's regions deeply: Seminyak, Canggu, Ubud, Nusa Dua, Uluwatu, Amed, Lovina, Sidemen, Munduk, and more.

When building itineraries or answering questions that involve travel between places, ALWAYS call get_travel_time to fetch accurate driving/riding times. Use the returned duration and distance in your response so travellers know exactly how long each leg takes.

## Render pattern for itineraries

When presenting a multi-stop itinerary, use EXACTLY this markdown structure:

## Day N — [Title]
*[Short tagline, e.g. "Beaches, temples & surf vibes"]*

**[emoji] [Time] — [Place Name]** \`sem-mood:E/V/H\`
[One sentence description. Include entry fee or dress code if relevant.]

> 🚗 **[X mins]** · [Y km] → **[Next Place Name]** \`sem-mood:E/V/H\`

[Repeat stop + route connector for every stop. Omit the route connector after the final stop of each day.]

The inline tokens MUST use EXACTLY the format \`sem-mood:E/V/H\` where E, V, H are integers 0–100 for cumulative projected Energy / Vibe / Hunger AFTER completing that stop (first line) or AFTER completing that drive and arriving at the named place (blockquote line). The UI renders them as compact mood meters. Project cumulatively through the day using the same heuristics as the final mood block.

[📍 Open Day N in Google Maps](https://www.google.com/maps/dir/Place+Name+1,+Bali/Place+Name+2,+Bali/Place+Name+3,+Bali)

Rules for the Google Maps link:
- Build one link per day using ALL stops for that day in order.
- Replace spaces with + in each place name.
- Always append ,+Bali to each place name (e.g. Tanah+Lot,+Bali).
- Use this base URL: https://www.google.com/maps/dir/

---
[One or two sentences inviting the user to customise.]

## Weather

When the user asks about weather, packing, rain, or temperature for any place in Bali:
1. Call get_weather ONCE with ALL relevant place names in a single call — never split the same places across multiple calls in the same turn.
2. If you already received a successful get_weather result for a place earlier in this turn, use that data directly — do NOT call the tool again for that place.
3. If the user's follow-up only references conditions you already reported in your immediately previous message and is NOT asking for a live update, answer from that prose without calling the tool again.
4. Report the live conditions clearly in prose (temperature, description, rain chance).
5. After your prose, emit EXACTLY one semeton-weather block listing those place names (one per line):

\`\`\`semeton-weather
Ubud, Bali
Seminyak, Bali
\`\`\`

Rules for the semeton-weather block:
- List ONLY place names — no numbers, temperatures, or weather data inside the block. The client fetches live data itself.
- Emit at most ONE block per response.
- For itinerary responses: you may include ONE block after the final day's maps link, listing the key destination(s) for that trip.
- Do NOT emit the block if the user is asking a general/seasonal question where live data isn't meaningful.

## Other guidelines
- Suggest the best time of day for each place (e.g. sunrise at Tegalalang, sunset at Uluwatu).
- Group nearby attractions to minimise backtracking.
- Prefer scooter (TWO_WHEELER) for short intra-region trips; car (DRIVE) for longer journeys or families.
- If the traveller doesn't specify transport, assume DRIVE.
- For non-itinerary answers (single questions, tips, etc.) use plain prose or a simple bullet list — do NOT force the itinerary pattern.
- Use the destination reference below for seasonal norms, regional character, traffic, safety, and local tips. For current weather and travel times, always use the live tools.`;

function buildSystemPrompt(): string {
  const guide = getPlanGuide();
  if (!guide) return BASE_SYSTEM_PROMPT;
  return (
    BASE_SYSTEM_PROMPT +
    `\n\n## Destination reference (internal)\n\nThe following is a curated reference about Bali's regions. Use it for seasonal context, traffic patterns, local tips, and safety — not for live data.\n\n${guide}`
  );
}

// --- Tool call handlers ---
async function handleTravelTime(
  tc: ChatCompletionMessageFunctionToolCall,
): Promise<string> {
  let args: { origin?: string; destination?: string; travel_mode?: string };
  try {
    args = JSON.parse(tc.function.arguments) as typeof args;
  } catch {
    return JSON.stringify({ error: "Could not parse tool arguments." });
  }

  const { origin, destination, travel_mode } = args;
  if (!origin || !destination) {
    return JSON.stringify({ error: "origin and destination are required." });
  }

  try {
    const result = await computeRoute(
      origin,
      destination,
      (travel_mode as TravelMode | undefined) ?? "DRIVE",
    );
    return JSON.stringify(result);
  } catch (err) {
    return JSON.stringify({
      error: err instanceof Error ? err.message : "Route lookup failed.",
    });
  }
}

async function handleGetWeather(
  tc: ChatCompletionMessageFunctionToolCall,
): Promise<string> {
  let args: { places?: string[] };
  try {
    args = JSON.parse(tc.function.arguments) as typeof args;
  } catch {
    return JSON.stringify({ error: "Could not parse tool arguments." });
  }

  const places = [...new Set(
    (args.places ?? []).map((p: string) => p.trim()).filter(Boolean),
  )].slice(0, 5);
  if (places.length === 0) {
    return JSON.stringify({ error: "places array is required and must not be empty." });
  }

  const results = await Promise.all(
    places.map(async (name) => {
      try {
        const { lat, lon, label } = await geocodePlace(name);
        const current = await getWeather(lat, lon);
        return { name: label, lat, lon, current };
      } catch (err) {
        return {
          name,
          error: err instanceof Error ? err.message : "Weather lookup failed.",
        };
      }
    }),
  );

  return JSON.stringify({ weather: results });
}

export async function POST(request: Request) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey?.trim()) {
    return Response.json(
      { error: "Server misconfiguration: OPENAI_API_KEY is not set." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawBody = body as { messages?: unknown; mood?: unknown };

  const clientMessages = sanitizeMessages(rawBody?.messages);
  if (clientMessages.length === 0) {
    return Response.json(
      { error: "Send a non-empty messages array." },
      { status: 400 },
    );
  }

  const mood = parseMood(rawBody?.mood);

  const openai = new OpenAI({
    apiKey: openaiKey,
    timeout: resolveOpenAITimeoutMs(),
  });

  const systemMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt() },
    ...(mood
      ? [{ role: "system" as const, content: buildMoodContext(mood) }]
      : []),
  ];

  const messages: ChatCompletionMessageParam[] = [
    ...systemMessages,
    ...clientMessages,
  ];

  // --- Tool-call resolution loop (non-streaming) ---
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      stream: false,
    });

    const choice = response.choices[0];
    if (!choice) break;
    if (choice.finish_reason !== "tool_calls") break;

    const assistantMsg = choice.message;
    messages.push(assistantMsg);

    const toolCalls = assistantMsg.tool_calls ?? [];

    await Promise.all(
      toolCalls.map(async (tc) => {
        if (!isFunctionToolCall(tc)) {
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({ error: "Unknown tool." }),
          });
          return;
        }

        let content: string;
        if (tc.function.name === "get_travel_time") {
          content = await handleTravelTime(tc);
        } else if (tc.function.name === "get_weather") {
          content = await handleGetWeather(tc);
        } else {
          content = JSON.stringify({ error: `Unknown tool: ${tc.function.name}` });
        }

        messages.push({ role: "tool", tool_call_id: tc.id, content });
      }),
    );
  }

  // --- Stream final answer ---
  let stream;
  try {
    stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      stream: true,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "OpenAI request failed.";
    return Response.json({ error: message }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
