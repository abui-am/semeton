export interface VibeOption {
  id: string;
  label: string;
  emoji: string;
}

export const PLANNER_VIBES: VibeOption[] = [
  { id: "foodie", label: "Foodie", emoji: "🍜" },
  { id: "spiritual", label: "Spiritual", emoji: "🛕" },
  { id: "beach", label: "Beach", emoji: "🌊" },
  { id: "nightlife", label: "Nightlife", emoji: "🌃" },
  { id: "wellness", label: "Wellness", emoji: "🧘" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧" },
];

export const PLANNER_HOME_BASES = [
  "Ubud",
  "Canggu",
  "Seminyak",
  "Uluwatu",
  "Sanur",
  "Nusa Dua",
  "Surprise me",
] as const;

export type HomeBase = (typeof PLANNER_HOME_BASES)[number];

export const PLANNER_DAY_MIN = 2;
export const PLANNER_DAY_MAX = 7;
