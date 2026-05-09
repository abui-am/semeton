"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import { MapEmbed } from "@/components/map-embed";
import { WeatherStrip } from "@/components/weather-strip";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** When set, POST /api/chat uses this instead of `content` (hidden from the UI). */
  apiContent?: string;
}

function newMessage(
  role: "user" | "assistant",
  content: string,
  options?: { apiContent?: string },
): ChatMessage {
  return { id: crypto.randomUUID(), role, content, ...options };
}

/** Strip transient ids; use `apiContent` for the wire format when present. */
function toApiMessages(history: ChatMessage[]): { role: "user" | "assistant"; content: string }[] {
  return history.map(({ role, content, apiContent }) => ({
    role,
    content: apiContent ?? content,
  }));
}

function createMarkdownComponents(deferRichMedia: boolean): Components {
  const linkClass =
    "inline-flex items-center gap-1 font-medium text-accent underline underline-offset-2 hover:brightness-[0.92] break-words";

  return {
    h1: ({ children }) => (
      <h1 className="font-display text-ink mb-1 mt-3 text-base font-bold wrap-break-word first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-display text-ink mb-1 mt-3 text-sm font-bold wrap-break-word first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-ink mb-0.5 mt-2 text-sm font-semibold first:mt-0">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-ink mb-1.5 last:mb-0 wrap-break-word">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="text-ink mb-1.5 ml-4 list-disc space-y-0.5 last:mb-0 wrap-break-word">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="text-ink mb-1.5 ml-4 list-decimal space-y-0.5 last:mb-0 wrap-break-word">{children}</ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    strong: ({ children }) => <strong className="text-ink font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => <hr className="border-border my-2" />,
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
            <span className="border-border bg-highlight text-muted my-1 block rounded-xl border border-dashed px-2 py-1.5 text-xs">
              Weather for {places.length} stop{places.length === 1 ? "" : "s"} loads when the reply
              finishes…
            </span>
          );
        }
        return <WeatherStrip places={places} />;
      }
      return (
        <code className="bg-highlight text-ink rounded px-1 py-0.5 font-mono text-xs wrap-break-word">
          {children}
        </code>
      );
    },
  };
}

const AssistantMarkdown = memo(function AssistantMarkdown({
  content,
  deferRichMedia,
}: {
  content: string;
  deferRichMedia: boolean;
}) {
  const components = useMemo(
    () => createMarkdownComponents(deferRichMedia),
    [deferRichMedia],
  );
  return <Markdown components={components}>{content}</Markdown>;
});

export interface ChatPanelProps {
  /**
   * Shown as first user bubble; assistant reply streams once on mount.
   * Prefer over `autoTrigger`; both are supported for compatibility.
   */
  seedUserMessage?: string;
  /**
   * Sent to `/api/chat` for the seeded turn only; omit to use `seedUserMessage` for both.
   * Lets the bubble stay user-friendly while the model still gets tool/format instructions.
   */
  seedApiMessage?: string;
  /** @deprecated use `seedUserMessage` */
  autoTrigger?: string;
  /** Resets onboarding from the planner (caller remounts with new key). */
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
  const listRef = useRef<HTMLDivElement>(null);
  const autoTriggered = useRef(false);

  const seedDisplay = seedUserMessage ?? autoTrigger;

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    const streaming = isSending && messages.at(-1)?.role === "assistant";
    const delay = streaming ? 120 : 0;
    scrollDebounceRef.current = setTimeout(() => {
      scrollDebounceRef.current = null;
      scrollToBottom();
    }, delay);
    return () => {
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    };
  }, [messages, isSending, scrollToBottom]);

  const streamReply = useCallback(async (history: ChatMessage[]) => {
    setIsSending(true);
    setError(null);

    const placeholderIndex = history.length;
    setMessages([...history, newMessage("assistant", "")]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toApiMessages(history) }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
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

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setInput("");
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

  const lastIndex = messages.length - 1;
  const streamingAssistantBubble =
    isSending && lastIndex >= 0 && messages[lastIndex]?.role === "assistant";

  return (
    <div className="border-border bg-card flex min-h-0 flex-1 flex-col border-x-0 border-t border-b shadow-none sm:min-h-[70vh] sm:rounded-2xl sm:border sm:shadow-[0_12px_48px_-8px_rgba(0,0,0,0.55)] md:rounded-2xl">
      <header className="border-border relative flex shrink-0 flex-wrap items-start justify-between gap-2 border-b px-4 py-3 sm:items-center sm:gap-3">
        <div className="min-w-0 pr-6 sm:pr-0">
          <p className="text-muted mb-1 hidden text-[0.65rem] font-semibold tracking-[0.2em] uppercase sm:block">
            Plan · Navigate · Feel better
          </p>
          <h1 className="font-display text-ink truncate text-[0.95rem] font-semibold sm:text-base">
            Bali itinerary planner
          </h1>
          <p className="text-muted mt-0.5 hidden text-xs sm:block">
            Live travel times · maps · weather when you need them
          </p>
        </div>
        {onStartOver ? (
          <button
            type="button"
            onClick={onStartOver}
            className="border-border text-ink hover:bg-highlight absolute top-3 right-3 flex min-h-10 min-w-10 items-center justify-center rounded-full border px-3 py-2 text-[11px] font-medium sm:relative sm:top-auto sm:right-auto sm:min-h-9 sm:self-center sm:text-xs"
          >
            Start over
          </button>
        ) : null}
      </header>

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 [-webkit-overflow-scrolling:touch]"
        aria-live="polite"
      >
        {messages.length === 0 && !seedDisplay && (
          <div className="text-muted flex flex-col gap-2 text-center text-base sm:text-sm">
            <p className="text-ink font-medium">Plan your perfect Bali trip</p>
            <p className="px-2">
              Try:{" "}
              <em className="text-muted not-italic">
                &quot;Plan a 3-day itinerary from Seminyak through Ubud to Uluwatu&quot;
              </em>
            </p>
            <p className="px-2">
              Or:{" "}
              <em className="text-muted not-italic">
                &quot;Driving time from Canggu to Tegalalang?&quot;
              </em>
            </p>
          </div>
        )}
        {messages.map((m, i) => {
          const deferRichMedia =
            m.role === "assistant" && streamingAssistantBubble && i === lastIndex;
          return (
            <div
              key={m.id}
              className={`wrap-break-word max-w-[min(92%,520px)] rounded-2xl px-3 py-2.5 text-base leading-snug sm:max-w-[85%] sm:py-2 sm:text-sm ${
                m.role === "user"
                  ? "bg-accent text-inverse self-end shadow-[0_4px_14px_-6px_rgba(209,125,86,0.65)]"
                  : "border-border bg-canvas max-w-none border text-ink self-start sm:max-w-[85%]"
              }`}
            >
              {m.role === "user" ? (
                <span className="whitespace-pre-wrap">{m.content}</span>
              ) : m.content ? (
                <AssistantMarkdown content={m.content} deferRichMedia={deferRichMedia} />
              ) : isSending ? (
                <span className="text-muted animate-pulse">…</span>
              ) : null}
            </div>
          );
        })}
      </div>

      {error && (
        <p
          className="border-border shrink-0 border-t bg-red-950/60 px-4 py-2 text-base text-red-300 sm:text-sm"
          role="alert"
        >
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-border bg-card sticky bottom-0 z-10 flex shrink-0 gap-2 border-t pb-safe pt-3 pr-3 pl-3 sm:static sm:pb-3 sm:pl-4"
      >
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about routes, day trips…"
          rows={2}
          disabled={isSending}
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="on"
          className="border-border bg-card text-ink placeholder:text-muted focus:ring-accent/35 box-border max-h-[30dvh] min-h-14 flex-1 resize-none rounded-xl border px-3 py-3 text-base leading-snug outline-none focus:ring-2 disabled:opacity-45 sm:min-h-11 sm:py-2 sm:text-sm"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="bg-accent text-inverse hover:brightness-[0.95] flex min-h-14 min-w-[4.25rem] shrink-0 touch-manipulation flex-col items-center justify-center rounded-xl px-3 text-base font-semibold transition active:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-11 sm:w-auto sm:self-end sm:px-4 sm:text-sm"
        >
          {isSending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
