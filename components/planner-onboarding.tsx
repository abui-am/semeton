"use client";

import Image from "next/image";
import { useState } from "react";
import {
  PLANNER_DAY_MAX,
  PLANNER_DAY_MIN,
  PLANNER_HOME_BASES,
  PLANNER_VIBES,
} from "@/lib/onboarding/constants";
import type { PlannerOnboardingAnswers } from "@/lib/onboarding/build-seed-message";

function ContourOrnament() {
  return (
    <svg
      className="pointer-events-none absolute -bottom-30 -right-30 h-130 w-130 opacity-[0.45]"
      viewBox="0 0 520 520"
      aria-hidden
    >
      <g fill="none" stroke="#3A2E20" strokeWidth={1.2}>
        {Array.from({ length: 14 }).map((_, i) => (
          <circle
            key={i}
            cx="260"
            cy="260"
            r={40 + i * 18}
            strokeDasharray={i % 2 ? "2 8" : "0"}
            opacity={0.6 - i * 0.03}
          />
        ))}
      </g>
    </svg>
  );
}

interface PlannerOnboardingProps {
  onComplete: (answers: PlannerOnboardingAnswers) => void;
}

export function PlannerOnboarding({ onComplete }: PlannerOnboardingProps) {
  const [step, setStep] = useState(0);
  const [days, setDays] = useState(4);
  const [vibeIds, setVibeIds] = useState<string[]>(() => [
    PLANNER_VIBES[0]?.id ?? "foodie",
    PLANNER_VIBES[1]?.id ?? "spiritual",
  ]);
  const [homeBase, setHomeBase] = useState<(typeof PLANNER_HOME_BASES)[number]>(
    PLANNER_HOME_BASES[0] ?? "Ubud",
  );

  function toggleVibe(id: string) {
    setVibeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function canContinue(): boolean {
    if (step === 0) return true;
    if (step === 1) return vibeIds.length > 0;
    if (step === 2) return Boolean(homeBase);
    return false;
  }

  function advance() {
    if (!canContinue()) return;
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    onComplete({ days, vibeIds, homeBase });
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  const titles = ["How long are you here?", "What’s your vibe?", "Pick your home base"];
  const stepLabel = `${step + 1} / 3`;

  return (
    <div className="font-sans relative flex min-h-dvh flex-col overflow-x-hidden overflow-y-auto bg-canvas text-ink">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 80% 0%, rgba(232,100,42,0.14), transparent 60%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(232,100,42,0.07), transparent 60%)",
        }}
      />
      <ContourOrnament />

      <header className="relative z-2 flex shrink-0 items-start justify-between gap-3 pt-safe px-4 pb-3 sm:items-center sm:px-8 sm:pb-4 sm:pt-5">
        <div className="min-w-0 flex-1">
          <Image
            src="/brand/semeton-logo.png"
            alt="semeton — plan, navigate, feel better"
            width={280}
            height={120}
            sizes="(max-width:480px) 100vw, 240px"
            className="h-auto w-full max-w-[200px] object-contain object-left sm:max-w-[220px]"
            priority
          />
        </div>
        <span className="text-muted mt-1 shrink-0 text-[10px] font-medium tracking-wide sm:mt-0 sm:text-xs">
          Bali only
        </span>
      </header>

      <main className="relative z-2 flex flex-1 flex-col items-center px-4 pb-safe pt-1 sm:px-8 sm:pb-10 sm:pt-2">
        <p className="text-muted mb-1.5 text-[0.65rem] font-semibold tracking-[0.2em] uppercase sm:mb-2 sm:text-xs">
          {stepLabel}
        </p>
        <h1 className="font-display text-ink mb-6 max-w-md px-1 text-center text-xl leading-snug font-bold tracking-tight sm:mb-10 sm:text-2xl md:text-3xl">
          {titles[step]}
        </h1>

        <div className="bg-card border-border w-full max-w-md rounded-2xl border p-4 pb-5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.45)] sm:p-6">
          {step === 0 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-ink text-sm font-medium">{days} days</span>
              </div>
              <div className="grid grid-cols-6 gap-2 sm:flex sm:flex-wrap sm:gap-2">
                {Array.from(
                  { length: PLANNER_DAY_MAX - PLANNER_DAY_MIN + 1 },
                  (_, i) => PLANNER_DAY_MIN + i,
                ).map((n) => {
                  const on = n === days;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDays(n)}
                      className={`col-span-3 flex min-h-11 min-w-0 items-center justify-center rounded-xl border text-base font-medium transition sm:min-h-[2.75rem] sm:flex-1 sm:text-sm ${
                        on
                          ? "border-accent bg-accent text-inverse shadow-[0_4px_14px_-4px_rgba(232,100,42,0.45)] active:brightness-95"
                          : "border-border bg-card text-ink active:bg-highlight"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-wrap gap-2">
              {PLANNER_VIBES.map((v) => {
                const on = vibeIds.includes(v.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleVibe(v.id)}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-2 text-base font-medium transition sm:min-h-[2.75rem] sm:text-sm ${
                      on
                        ? "border-accent bg-highlight text-ink active:brightness-95"
                        : "border-border bg-card text-ink active:bg-highlight"
                    }`}
                  >
                    <span className="text-lg leading-none sm:text-base" aria-hidden>
                      {v.emoji}
                    </span>
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="relative">
              <label htmlFor="home-base" className="sr-only">
                Home base
              </label>
              <select
                id="home-base"
                value={homeBase}
                onChange={(e) =>
                  setHomeBase(e.target.value as (typeof PLANNER_HOME_BASES)[number])
                }
                className="border-border text-ink focus:ring-accent/30 box-border min-h-11 w-full cursor-pointer appearance-none rounded-xl border bg-card py-3 pr-11 pl-3.5 text-base outline-none focus:ring-2 sm:text-sm"
              >
                {PLANNER_HOME_BASES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <span
                className="text-muted pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-base sm:text-sm"
                aria-hidden
              >
                ▾
              </span>
            </div>
          )}

          <div className="mt-6 flex gap-3 sm:mt-8">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="border-border text-ink hover:bg-highlight/50 inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border bg-card px-4 text-base font-medium active:bg-highlight sm:text-sm"
              >
                Back
              </button>
            ) : (
              <span className="w-18 shrink-0" aria-hidden />
            )}
            <button
              type="button"
              disabled={!canContinue()}
              onClick={advance}
              className="bg-accent text-inverse inline-flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 text-base font-semibold shadow-[0_4px_18px_-4px_rgba(232,100,42,0.5)] transition active:brightness-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:text-sm"
            >
              {step === 2 ? "Start planning" : "Continue"}
            </button>
          </div>
        </div>

        <p className="text-muted mt-6 mb-2 max-w-sm px-4 text-center text-[11px] tracking-wide sm:mt-8 sm:text-xs">
          Plan · Navigate · Feel better
        </p>
      </main>
    </div>
  );
}
