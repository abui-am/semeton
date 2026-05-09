import { PLANNER_VIBES } from "@/lib/onboarding/constants";

export interface PlannerOnboardingAnswers {
  days: number;
  vibeIds: string[];
  homeBase: string;
}

function vibeLabels(ids: string[]): string {
  const map = new Map(PLANNER_VIBES.map((v) => [v.id, v.label]));
  return ids
    .map((id) => map.get(id) ?? id)
    .filter(Boolean)
    .join(", ");
}

/**
 * Shown in the first chat bubble after onboarding (no tool names or markdown instructions).
 */
export function buildSeedVisibleSummary(input: PlannerOnboardingAnswers): string {
  const vibes = vibeLabels(input.vibeIds);
  return [
    `I'm planning a Bali trip for ${input.days} day${input.days === 1 ? "" : "s"}.`,
    "",
    `My vibes: ${vibes}.`,
    "",
    `Home base: ${input.homeBase}.`,
    "",
    "Please plan my days with realistic routes and practical timing.",
  ].join("\n");
}

/**
 * Full first user turn sent to the model (includes tool / render instructions). Not shown in the UI.
 */
export function buildSeedMessage(input: PlannerOnboardingAnswers): string {
  const vibes = vibeLabels(input.vibeIds);
  return [
    `I'm planning a Bali trip for ${input.days} day${input.days === 1 ? "" : "s"}.`,
    `My vibes: ${vibes}.`,
    `Home base: ${input.homeBase}.`,
    "",
    "Please draft a practical day-by-day itinerary with realistic routing across Bali.",
    "Use get_travel_time for every leg between stops (pick modes that make sense, e.g. drive or two-wheeler).",
    "Where current conditions matter, use the weather tool and include a ```semeton-weather``` code block with one place name per line for key stops.",
    "Follow the itinerary render pattern from your instructions (clear days, stops, ETAs/links).",
  ].join("\n");
}
