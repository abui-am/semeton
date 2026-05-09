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
}

function newMessage(role: "user" | "assistant", content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content };
}

/** Strip transient ids before sending to the API. */
function toApiMessages(history: ChatMessage[]): { role: "user" | "assistant"; content: string }[] {
  return history.map(({ role, content }) => ({ role, content }));
}

function createMarkdownComponents(deferRichMedia: boolean): Components {
  const linkClass =
    "inline-flex items-center gap-1 font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300";

  return {
    h1: ({ children }) => (
      <h1 className="mb-1 mt-3 text-base font-bold first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-1 mt-3 text-sm font-bold first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-0.5 mt-2 text-sm font-semibold first:mt-0">{children}</h3>
    ),
    p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
    ul: ({ children }) => (
      <ul className="mb-1.5 ml-4 list-disc space-y-0.5 last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-1.5 ml-4 list-decimal space-y-0.5 last:mb-0">{children}</ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => <hr className="my-2 border-zinc-200 dark:border-zinc-700" />,
    a: ({ href, children }) => {
      const isMapsDir =
        typeof href === "string" && href.includes("google.com/maps/dir/");
      if (isMapsDir && !deferRichMedia) {
        return <MapEmbed href={href}>{children}</MapEmbed>;
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
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
            <span className="my-1 block rounded-lg border border-dashed border-zinc-300 bg-zinc-100/80 px-2 py-1.5 text-xs text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400">
              Weather for {places.length} stop{places.length === 1 ? "" : "s"} loads when the reply finishes…
            </span>
          );
        }
        return <WeatherStrip places={places} />;
      }
      return (
        <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-xs dark:bg-zinc-700">
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

interface ChatPanelProps {
  /** If set, this message is silently sent on mount to seed the first AI response. */
  autoTrigger?: string;
}

export function ChatPanel({ autoTrigger }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const autoTriggered = useRef(false);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    const streaming =
      isSending && messages.at(-1)?.role === "assistant";
    const delay = streaming ? 120 : 0;
    scrollDebounceRef.current = setTimeout(() => {
      scrollDebounceRef.current = null;
      scrollToBottom();
    }, delay);
    return () => {
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    };
  }, [messages, isSending, scrollToBottom]);

  /** Stream an assistant reply for an arbitrary history without adding a user bubble. */
  const streamReply = useCallback(
    async (history: ChatMessage[]) => {
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
      } catch (err) {
        const message = err instanceof Error ? err.message : "Request failed";
        setError(message);
        setMessages((prev) => prev.slice(0, placeholderIndex));
      } finally {
        setIsSending(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!autoTrigger || autoTriggered.current) return;
    autoTriggered.current = true;
    void streamReply([newMessage("user", autoTrigger)]);
  }, [autoTrigger, streamReply]);

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
    isSending &&
    lastIndex >= 0 &&
    messages[lastIndex]?.role === "assistant";

  return (
    <div className="flex h-full min-h-[70vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h1 className="font-semibold text-zinc-900 dark:text-zinc-100">
          🌴 Semeton — Bali Itinerary Planner
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Ask about places, routes, day trips, or full itineraries across Bali.
          Travel times are fetched live from Google Maps.
        </p>
      </header>

      <div
        ref={listRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
              Plan your perfect Bali trip ✨
            </p>
            <p>
              Try:{" "}
              <em>
                &quot;Plan a 3-day itinerary from Seminyak to Ubud and
                Uluwatu&quot;
              </em>
            </p>
            <p>
              Or:{" "}
              <em>
                &quot;How long does it take to drive from Canggu to Tegalalang
                Rice Terrace?&quot;
              </em>
            </p>
          </div>
        )}
        {messages.map((m, i) => {
          const deferRichMedia =
            m.role === "assistant" &&
            streamingAssistantBubble &&
            i === lastIndex;
          return (
          <div
            key={m.id}
            className={`max-w-[85%] wrap-break-word rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "self-end bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "self-start border border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            }`}
          >
            {m.role === "user" ? (
              m.content
            ) : m.content ? (
              <AssistantMarkdown
                content={m.content}
                deferRichMedia={deferRichMedia}
              />
            ) : isSending ? (
              <span className="animate-pulse">…</span>
            ) : null}
          </div>
          );
        })}
      </div>

      {error && (
        <p
          className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
      >
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Where in Bali do you want to go? Ask for a route, day trip, or full itinerary…"
          rows={2}
          disabled={isSending}
          className="min-h-11 flex-1 resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-500 dark:placeholder:text-zinc-500"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="shrink-0 self-end rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
