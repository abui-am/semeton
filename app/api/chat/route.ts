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

**[emoji] [Time] — [Place Name]**
[One sentence description. Include entry fee or dress code if relevant.]

> 🚗 **[X mins]** · [Y km] → **[Next Place Name]**

[Repeat stop + route connector for every stop. Omit the route connector after the final stop of each day.]

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

  const clientMessages = sanitizeMessages(
    (body as { messages?: unknown })?.messages,
  );
  if (clientMessages.length === 0) {
    return Response.json(
      { error: "Send a non-empty messages array." },
      { status: 400 },
    );
  }

  const openai = new OpenAI({ apiKey: openaiKey });

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt() },
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
