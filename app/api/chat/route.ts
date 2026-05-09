import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageFunctionToolCall,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { computeRoute, type TravelMode } from "@/lib/google-routes/client";

function isFunctionToolCall(
  tc: ChatCompletionMessageToolCall,
): tc is ChatCompletionMessageFunctionToolCall {
  return tc.type === "function";
}

const MAX_MESSAGES = 32;
const MAX_CONTENT_LENGTH = 12_000;
const MAX_TOOL_ROUNDS = 4;

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
];

const SYSTEM_PROMPT = `You are Semeton, an expert Bali travel and itinerary planner.

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

## Other guidelines
- Suggest the best time of day for each place (e.g. sunrise at Tegalalang, sunset at Uluwatu).
- Group nearby attractions to minimise backtracking.
- Prefer scooter (TWO_WHEELER) for short intra-region trips; car (DRIVE) for longer journeys or families.
- If the traveller doesn't specify transport, assume DRIVE.
- For non-itinerary answers (single questions, tips, etc.) use plain prose or a simple bullet list — do NOT force the itinerary pattern.`;

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
    { role: "system", content: SYSTEM_PROMPT },
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
        if (!isFunctionToolCall(tc) || tc.function.name !== "get_travel_time") {
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({ error: "Unknown tool." }),
          });
          return;
        }

        let args: {
          origin?: string;
          destination?: string;
          travel_mode?: string;
        };
        try {
          args = JSON.parse(tc.function.arguments) as typeof args;
        } catch {
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({ error: "Could not parse tool arguments." }),
          });
          return;
        }

        const { origin, destination, travel_mode } = args;
        if (!origin || !destination) {
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              error: "origin and destination are required.",
            }),
          });
          return;
        }

        try {
          const result = await computeRoute(
            origin,
            destination,
            (travel_mode as TravelMode | undefined) ?? "DRIVE",
          );
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        } catch (err) {
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              error: err instanceof Error ? err.message : "Route lookup failed.",
            }),
          });
        }
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
