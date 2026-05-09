import { ChatPanel } from "@/components/chat-panel";

const INITIAL_PROMPT =
  "Show me a sample 3-day Bali itinerary starting from Seminyak. " +
  "Cover Day 1 (South Bali: Tanah Lot, Canggu), Day 2 (Ubud + Tegalalang Rice Terrace), " +
  "and Day 3 (Uluwatu Temple + Jimbaran Bay). " +
  "Use get_travel_time for every leg between stops and follow the itinerary render pattern exactly.";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-8 font-sans dark:bg-zinc-950">
      <div className="mb-4 w-full max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Bali · AI Trip Planner
        </p>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          🌴 Semeton
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your personal Bali itinerary planner with live Google Maps travel
          times.
        </p>
      </div>

      <ChatPanel autoTrigger={INITIAL_PROMPT} />
    </div>
  );
}
