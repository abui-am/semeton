"use client";

import { useCallback, useState } from "react";
import { buildSeedMessage, buildSeedVisibleSummary } from "@/lib/onboarding/build-seed-message";
import type { PlannerOnboardingAnswers } from "@/lib/onboarding/build-seed-message";
import { ChatPanel } from "@/components/chat-panel";
import { PlannerOnboarding } from "@/components/planner-onboarding";

function ContourOrnament() {
  return (
    <svg
      className="pointer-events-none absolute -bottom-30 -right-30 h-130 w-130 opacity-[0.35]"
      viewBox="0 0 520 520"
      aria-hidden
    >
      <g fill="none" stroke="#D8C9AC" strokeWidth={1.2}>
        {Array.from({ length: 14 }).map((_, i) => (
          <circle
            key={i}
            cx="260"
            cy="260"
            r={40 + i * 18}
            strokeDasharray={i % 2 ? "2 8" : "0"}
            opacity={0.55 - i * 0.03}
          />
        ))}
      </g>
    </svg>
  );
}

export function HomePageClient() {
  const [sessionId, setSessionId] = useState(0);
  const [phase, setPhase] = useState<"onboarding" | "chat">("onboarding");
  const [seedPair, setSeedPair] = useState<{ visible: string; api: string } | null>(
    null,
  );

  const handleOnboardingComplete = useCallback((answers: PlannerOnboardingAnswers) => {
    setSeedPair({
      visible: buildSeedVisibleSummary(answers),
      api: buildSeedMessage(answers),
    });
    setPhase("chat");
  }, []);

  const handleStartOver = useCallback(() => {
    setSeedPair(null);
    setPhase("onboarding");
    setSessionId((id) => id + 1);
  }, []);

  if (phase === "onboarding") {
    return <PlannerOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="font-sans relative flex w-full flex-1 flex-col overflow-hidden bg-canvas text-ink sm:items-center sm:px-4 sm:py-6">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 80% 0%, rgba(232,100,42,0.14), transparent 60%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(232,100,42,0.07), transparent 60%)",
        }}
      />
      <ContourOrnament />

      <div className="relative z-2 flex min-h-0 w-full max-w-2xl flex-1 flex-col pt-safe sm:px-2 sm:pt-0">
        {seedPair ? (
          <ChatPanel
            key={sessionId}
            seedUserMessage={seedPair.visible}
            seedApiMessage={seedPair.api}
            onStartOver={handleStartOver}
          />
        ) : null}
      </div>
    </div>
  );
}
