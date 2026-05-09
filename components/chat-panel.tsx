"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import { MapEmbed } from "@/components/map-embed";
import { WeatherStrip } from "@/components/weather-strip";

// ─── mood ────────────────────────────────────────────────────────────────────

interface MoodState {
  energy: number;  // 0–100 physical energy (low = tired)
  vibe: number;    // 0–100 emotional freshness
  hunger: number;  // 0–100 hunger level
}

const DEFAULT_MOOD: MoodState = { energy: 80, vibe: 70, hunger: 30 };

function clampMood(v: number) {
  return Math.min(100, Math.max(0, Math.round(v)));
}

function energyLabel(v: number) {
  if (v <= 30) return "Drained";
  if (v <= 60) return "Moderate";
  return "Energetic";
}

function vibeLabel(v: number) {
  if (v <= 30) return "Low";
  if (v <= 60) return "Alright";
  return "Fresh";
}

function hungerLabel(v: number) {
  if (v <= 30) return "Full";
  if (v <= 60) return "Peckish";
  return "Starving";
}

const MOOD_DIMENSIONS = [
  { key: "energy", emoji: "⚡", label: "Energy", labelFn: energyLabel },
  { key: "vibe",   emoji: "😊", label: "Vibe",   labelFn: vibeLabel   },
  { key: "hunger", emoji: "🍽️", label: "Hunger", labelFn: hungerLabel },
] as const;

/** Parse a `semeton-mood` block body. Returns null if any dimension is missing/invalid. */
function parseMoodBlock(raw: string): MoodState | null {
  const get = (key: string) => {
    const match = new RegExp(`${key}\\s*:\\s*(\\d{1,3})`, "i").exec(raw);
    if (!match) return Number.NaN;
    return parseInt(match[1] ?? "", 10);
  };
  const energy = get("energy");
  const vibe = get("vibe");
  const hunger = get("hunger");
  if ([energy, vibe, hunger].some((n) => Number.isNaN(n))) return null;
  return {
    energy: clampMood(energy),
    vibe: clampMood(vibe),
    hunger: clampMood(hunger),
  };
}

/** Slim, read-only mood strip displayed below the chat header. */
function MoodStrip({ mood }: { mood: MoodState }) {
  return (
    <div
      className="border-border bg-canvas flex shrink-0 items-center gap-3 border-b px-4 py-2"
      aria-label="Current traveller mood"
    >
      <span className="text-muted shrink-0 text-[9px] font-semibold tracking-[0.16em] uppercase">
        Mood
      </span>
      <div className="flex flex-1 items-center gap-3 sm:gap-4">
        {MOOD_DIMENSIONS.map((dim) => {
          const value = mood[dim.key];
          const isLow = value <= 30;
          const isHigh = value >= 70;
          return (
            <div key={dim.key} className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="shrink-0 text-xs leading-none" aria-hidden>
                {dim.emoji}
              </span>
              <div className="bg-highlight relative h-1 min-w-6 flex-1 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${value}%`,
                    backgroundColor: isHigh
                      ? "var(--color-accent)"
                      : isLow
                        ? "var(--color-muted)"
                        : "var(--color-ink)",
                    opacity: isLow ? 0.5 : 1,
                  }}
                />
              </div>
              <span className="text-muted shrink-0 text-[10px] font-medium tabular-nums">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Inline card rendered for a `semeton-mood` block in assistant markdown. */
function MoodUpdateCard({ mood }: { mood: MoodState }) {
  return (
    <span className="border-border bg-highlight/60 my-2 block rounded-xl border px-3 py-2.5">
      <span className="text-muted mb-2 block text-[10px] font-semibold tracking-[0.14em] uppercase">
        Mood after this plan
      </span>
      <span className="flex flex-col gap-1.5">
        {MOOD_DIMENSIONS.map((dim) => {
          const value = mood[dim.key];
          const isLow = value <= 30;
          const isHigh = value >= 70;
          return (
            <span key={dim.key} className="flex items-center gap-2">
              <span className="w-3 shrink-0 text-center text-xs leading-none" aria-hidden>
                {dim.emoji}
              </span>
              <span className="text-ink w-12 shrink-0 text-[11px] font-medium">
                {dim.label}
              </span>
              <span className="bg-card/80 relative h-1.5 flex-1 overflow-hidden rounded-full">
                <span
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                  style={{
                    width: `${value}%`,
                    backgroundColor: isHigh
                      ? "var(--color-accent)"
                      : isLow
                        ? "var(--color-muted)"
                        : "var(--color-ink)",
                    opacity: isLow ? 0.5 : 1,
                  }}
                />
              </span>
              <span className="text-muted w-16 shrink-0 text-right text-[10px] font-medium">
                {dim.labelFn(value)}
              </span>
              <span className="text-ink w-7 shrink-0 text-right text-[11px] font-semibold tabular-nums">
                {value}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

/** Compact inline meter after each itinerary line (\`sem-mood:e/v/h\`). */
function InlineMoodMeter({
  mood,
  deferRichMedia,
}: {
  mood: MoodState;
  deferRichMedia: boolean;
}) {
  if (deferRichMedia) {
    return (
      <span
        className="border-border bg-highlight text-muted ml-1 inline-flex items-center rounded-full border border-dashed px-1.5 py-px align-middle text-[9px]"
        aria-hidden
      >
        ⋯
      </span>
    );
  }

  return (
    <span
      className="border-border bg-highlight/80 ml-1 inline-flex max-w-[min(100%,14rem)] flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-full border px-1.5 py-0.5 align-middle"
      title={`Energy ${mood.energy}, Vibe ${mood.vibe}, Hunger ${mood.hunger}`}
      aria-label={`Mood snapshot: energy ${mood.energy}, vibe ${mood.vibe}, hunger ${mood.hunger}`}
    >
      {MOOD_DIMENSIONS.map((dim) => {
        const value = mood[dim.key];
        const isLow = value <= 30;
        const isHigh = value >= 70;
        return (
          <span
            key={dim.key}
            className="inline-flex shrink-0 items-center gap-0.5"
          >
            <span className="text-[10px] leading-none" aria-hidden>
              {dim.emoji}
            </span>
            <span className="bg-card/90 relative h-[3px] w-7 overflow-hidden rounded-full">
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${value}%`,
                  backgroundColor: isHigh
                    ? "var(--color-accent)"
                    : isLow
                      ? "var(--color-muted)"
                      : "var(--color-ink)",
                  opacity: isLow ? 0.55 : 1,
                }}
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Parses \`sem-mood:12/34/56\` (three 0–100 integers). */
const INLINE_SEM_MOOD_RE =
  /^sem-mood:\s*(\d{1,3})\s*\/\s*(\d{1,3})\s*\/\s*(\d{1,3})$/i;

function parseInlineSemMood(raw: string): MoodState | null {
  const m = INLINE_SEM_MOOD_RE.exec(raw.trim());
  if (!m) return null;
  const energy = clampMood(Number(m[1]));
  const vibe = clampMood(Number(m[2]));
  const hunger = clampMood(Number(m[3]));
  return { energy, vibe, hunger };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** When set, POST /api/chat uses this instead of `content`. */
  apiContent?: string;
}

function newMessage(
  role: "user" | "assistant",
  content: string,
  options?: { apiContent?: string },
): ChatMessage {
  return { id: crypto.randomUUID(), role, content, ...options };
}

function toApiMessages(
  history: ChatMessage[],
): { role: "user" | "assistant"; content: string }[] {
  return history.map(({ role, content, apiContent }) => ({
    role,
    content: apiContent ?? content,
  }));
}

// ─── prompt chips (empty state) ──────────────────────────────────────────────

const PROMPT_CHIPS = [
  { label: "3-day Ubud itinerary", emoji: "🗺️" },
  { label: "Best beach clubs in Canggu", emoji: "🏖️" },
  { label: "Canggu → Uluwatu drive time", emoji: "🛵" },
  { label: "Rainy day plans in Bali", emoji: "🌧️" },
] as const;

// ─── sub-components ──────────────────────────────────────────────────────────

/** Animated three-dot typing indicator. */
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="bg-muted h-2 w-2 rounded-full"
          style={{
            animation: `typing-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/** SVG arrow-up icon for the send button. */
function ArrowUpIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

/** SVG chevron-down for scroll FAB. */
function ChevronDownIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ─── markdown renderer ───────────────────────────────────────────────────────

function createMarkdownComponents(deferRichMedia: boolean): Components {
  const linkClass =
    "inline-flex items-center gap-1 font-medium text-accent underline underline-offset-2 hover:brightness-110 break-words";

  return {
    h1: ({ children }) => (
      <h1 className="font-display text-ink mb-2 mt-4 text-base font-bold first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-display text-ink mb-1.5 mt-3 text-sm font-bold first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-ink mb-1 mt-2.5 text-sm font-semibold first:mt-0">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-ink mb-2.5 leading-[1.75] last:mb-0">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="text-ink mb-2.5 ml-4 list-disc space-y-1.5 last:mb-0">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="text-ink mb-2.5 ml-4 list-decimal space-y-1.5 last:mb-0">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-[1.7]">{children}</li>,
    strong: ({ children }) => (
      <strong className="text-ink font-semibold">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => <hr className="border-border my-3" />,
    a: ({ href, children }) => {
      const isMapsDir =
        typeof href === "string" && href.includes("google.com/maps/dir/");
      if (isMapsDir && !deferRichMedia) {
        return <MapEmbed href={href}>{children}</MapEmbed>;
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {children}
        </a>
      );
    },
    pre: ({ children }) => <>{children}</>,
    code: ({ children, className }) => {
      const lang = /language-(\S+)/.exec(className ?? "")?.[1];
      if (lang === "semeton-weather") {
        const places = String(children)
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (places.length === 0) return null;
        if (deferRichMedia) {
          return (
            <span className="border-border bg-highlight text-muted my-1.5 block rounded-xl border border-dashed px-3 py-2 text-xs">
              Fetching weather for {places.length} stop
              {places.length === 1 ? "" : "s"}…
            </span>
          );
        }
        return <WeatherStrip places={places} />;
      }
      if (lang === "semeton-mood") {
        if (deferRichMedia) {
          return (
            <span className="border-border bg-highlight text-muted my-1.5 block rounded-xl border border-dashed px-3 py-2 text-xs">
              Projecting mood update…
            </span>
          );
        }
        const parsed = parseMoodBlock(String(children));
        if (!parsed) return null;
        return <MoodUpdateCard mood={parsed} />;
      }
      const inlineText = String(children).trim();
      const inlineMood = parseInlineSemMood(inlineText);
      if (inlineMood && !lang) {
        return (
          <InlineMoodMeter mood={inlineMood} deferRichMedia={deferRichMedia} />
        );
      }
      return (
        <code className="bg-highlight text-ink rounded px-1.5 py-0.5 font-mono text-xs">
          {children}
        </code>
      );
    },
  };
}

const AssistantMarkdown = memo(function AssistantMarkdown({
  content,
  deferRichMedia,
  isStreaming,
}: {
  content: string;
  deferRichMedia: boolean;
  isStreaming: boolean;
}) {
  const components = useMemo(
    () => createMarkdownComponents(deferRichMedia),
    [deferRichMedia],
  );
  return (
    <span className="block">
      <Markdown components={components}>{content}</Markdown>
      {isStreaming && (
        <span
          className="bg-accent ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.1em] rounded-full align-middle opacity-80"
          style={{ animation: "blink-cursor 0.9s step-end infinite" }}
          aria-hidden
        />
      )}
    </span>
  );
});

// ─── main component ──────────────────────────────────────────────────────────

export interface ChatPanelProps {
  seedUserMessage?: string;
  seedApiMessage?: string;
  /** @deprecated use `seedUserMessage` */
  autoTrigger?: string;
  onStartOver?: () => void;
}

export function ChatPanel({
  seedUserMessage,
  seedApiMessage,
  autoTrigger,
  onStartOver,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [mood, setMood] = useState<MoodState>(DEFAULT_MOOD);

  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoTriggered = useRef(false);
  const moodRef = useRef<MoodState>(mood);
  useEffect(() => { moodRef.current = mood; }, [mood]);

  const seedDisplay = seedUserMessage ?? autoTrigger;

  // ── scroll helpers ──────────────────────────────────────────────────────────

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  /** Track whether the user is near the bottom. */
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  }, []);

  /** Scroll to bottom after new messages; skip if user has scrolled up. */
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    const streaming = isSending && messages.at(-1)?.role === "assistant";
    if (!atBottom && !streaming) return; // don't interrupt manual scrolling
    const delay = streaming ? 100 : 0;
    scrollDebounceRef.current = setTimeout(
      () => scrollToBottom(streaming ? "smooth" : "instant" as ScrollBehavior),
      delay,
    );
    return () => {
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    };
  }, [messages, isSending, atBottom, scrollToBottom]);

  // ── textarea auto-grow ──────────────────────────────────────────────────────

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, window.innerHeight * 0.28) + "px";
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    resizeTextarea();
  }

  // ── streaming ───────────────────────────────────────────────────────────────

  const streamReply = useCallback(async (history: ChatMessage[]) => {
    setIsSending(true);
    setError(null);

    const placeholderIndex = history.length;
    setMessages([...history, newMessage("assistant", "")]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toApiMessages(history), mood: moodRef.current }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? res.statusText);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[placeholderIndex];
          if (last?.role === "assistant") {
            copy[placeholderIndex] = { ...last, content: accumulated };
          }
          return copy;
        });
      }

      const moodMatch = /```semeton-mood\s*\n([\s\S]*?)```/.exec(accumulated);
      if (moodMatch?.[1]) {
        const next = parseMoodBlock(moodMatch[1]);
        if (next) setMood(next);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
      setMessages((prev) => prev.slice(0, placeholderIndex));
    } finally {
      setIsSending(false);
    }
  }, []);

  useEffect(() => {
    if (!seedDisplay || autoTriggered.current) return;
    autoTriggered.current = true;
    const firstUser =
      seedApiMessage != null && seedApiMessage !== ""
        ? newMessage("user", seedDisplay, { apiContent: seedApiMessage })
        : newMessage("user", seedDisplay);
    void streamReply([firstUser]);
  }, [seedDisplay, seedApiMessage, streamReply]);

  // ── send ────────────────────────────────────────────────────────────────────

  async function sendMessage(text?: string) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isSending) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    const userMessage = newMessage("user", trimmed);
    const history = [...messages, userMessage];
    setMessages(history);
    await streamReply(history);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  // ── derived ─────────────────────────────────────────────────────────────────

  const lastIndex = messages.length - 1;
  const streamingAssistantBubble =
    isSending && lastIndex >= 0 && messages[lastIndex]?.role === "assistant";
  const isEmpty = messages.length === 0 && !seedDisplay;
  const canSend = input.trim().length > 0 && !isSending;

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="border-border bg-card relative flex min-h-0 flex-1 flex-col border-x-0 border-t border-b sm:rounded-2xl sm:border sm:shadow-[0_8px_48px_-8px_rgba(31,27,22,0.13)]">

      {/* ── Header ── */}
      <header className="border-border relative flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <h1 className="font-display text-ink text-[1rem] leading-tight font-semibold tracking-tight sm:text-[1.05rem]">
            Bali planner
          </h1>
          <p className="text-muted mt-0.5 text-[0.65rem] font-medium tracking-[0.18em] uppercase">
            Live routes · weather · maps
          </p>
        </div>
        {onStartOver && (
          <button
            type="button"
            onClick={onStartOver}
            className="border-border text-muted hover:text-ink hover:bg-highlight flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition sm:text-xs"
          >
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            New trip
          </button>
        )}
      </header>

      {/* ── Mood strip (read-only, AI-managed) ── */}
      <MoodStrip mood={mood} />

      {/* ── Messages ── */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="bg-canvas flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-6 [-webkit-overflow-scrolling:touch]"
        aria-live="polite"
      >

        {/* Empty state — prompt chips */}
        {isEmpty && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
            <div>
              <p className="font-display text-ink mb-1 text-lg font-semibold sm:text-xl">
                Plan your Bali trip
              </p>
              <p className="text-muted text-sm">
                Ask anything — routes, vibes, hidden spots
              </p>
            </div>
            <div className="grid w-full max-w-sm grid-cols-2 gap-2">
              {PROMPT_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => void sendMessage(chip.label)}
                  className="border-border bg-canvas hover:bg-highlight text-ink active:bg-highlight flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition"
                >
                  <span className="mt-px shrink-0 text-base leading-none">
                    {chip.emoji}
                  </span>
                  <span className="leading-snug">{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex flex-col gap-7">
          {messages.map((m, i) => {
            const isLast = i === lastIndex;
            const isStreamingThis = streamingAssistantBubble && isLast;
            const deferRichMedia = m.role === "assistant" && isStreamingThis;

            if (m.role === "user") {
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="bg-ink text-inverse max-w-[78%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-[1.75] shadow-[0_2px_10px_-4px_rgba(31,27,22,0.18)] sm:max-w-[72%]">
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className="flex items-start gap-3">
                {/* Avatar dot */}
                <div className="bg-accent mt-[0.45rem] h-2 w-2 shrink-0 rounded-full opacity-75" />
                <div className="min-w-0 flex-1 text-sm leading-[1.75]">
                  {m.content ? (
                    <AssistantMarkdown
                      content={m.content}
                      deferRichMedia={deferRichMedia}
                      isStreaming={isStreamingThis}
                    />
                  ) : isSending && isLast ? (
                    <TypingDots />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom spacer so last message clears the composer */}
        <div className="shrink-0 h-4" aria-hidden />
      </div>

      {/* ── Scroll-to-bottom FAB ── */}
      {!atBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="bg-card border-border text-muted hover:text-ink absolute bottom-[5.5rem] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-[0_4px_16px_-4px_rgba(31,27,22,0.12)] transition sm:bottom-[4.5rem]"
        >
          <ChevronDownIcon />
          Scroll down
        </button>
      )}

      {/* ── Error ── */}
      {error && (
        <p
          className="border-border shrink-0 border-t bg-red-50 px-4 py-2.5 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* ── Composer ── */}
      <form
        onSubmit={handleSubmit}
        className="border-border bg-card/95 relative flex shrink-0 items-end gap-2 border-t px-3 pb-safe pt-3 shadow-[0_-8px_24px_-4px_rgba(31,27,22,0.06)] backdrop-blur-sm sm:px-4"
      >
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about routes, spots, timing…"
          rows={1}
          disabled={isSending}
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="on"
          className="border-border bg-canvas text-ink placeholder:text-muted focus:border-accent/50 box-border max-h-[28dvh] min-h-[2.75rem] flex-1 resize-none rounded-xl border px-3.5 py-2.5 text-base leading-snug outline-none transition focus:ring-0 disabled:opacity-40 sm:text-sm"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          className="bg-accent text-inverse hover:brightness-110 mb-0 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition active:brightness-95 disabled:opacity-35 disabled:brightness-100 sm:h-[2.75rem] sm:w-[2.75rem]"
        >
          {isSending ? (
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="bg-inverse/70 h-1 w-1 rounded-full"
                  style={{
                    animation: `typing-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
                  }}
                />
              ))}
            </span>
          ) : (
            <ArrowUpIcon size={17} />
          )}
        </button>
      </form>
    </div>
  );
}
