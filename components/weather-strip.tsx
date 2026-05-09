"use client";

import { useEffect, useRef, useState } from "react";
import type { WeatherResult } from "@/lib/weather/client";

interface WeatherResponse {
  places: WeatherResult[];
}

const CONDITION_EMOJI: Record<string, string> = {
  CLEAR: "☀️",
  MOSTLY_CLEAR: "🌤️",
  PARTLY_CLOUDY: "⛅",
  MOSTLY_CLOUDY: "🌥️",
  CLOUDY: "☁️",
  OVERCAST: "☁️",
  RAIN: "🌧️",
  DRIZZLE: "🌦️",
  LIGHT_RAIN: "🌦️",
  HEAVY_RAIN: "🌧️",
  THUNDERSTORM: "⛈️",
  SNOW: "❄️",
  SLEET: "🌨️",
  BLOWING_SNOW: "🌨️",
  FOG: "🌫️",
  HAZE: "🌫️",
  WINDY: "💨",
};

function conditionEmoji(type: string, isDaytime: boolean): string {
  if (type === "CLEAR" && !isDaytime) return "🌙";
  return CONDITION_EMOJI[type] ?? "🌡️";
}

/** Shortens "Ubud, Bali, Indonesia" → "Ubud" for compact display. */
function shortLabel(name: string): string {
  return name.split(",")[0].trim();
}

interface WeatherStripProps {
  places: string[];
}

export function WeatherStrip({ places }: WeatherStripProps) {
  const [data, setData] = useState<WeatherResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Use a stable string key so the effect only runs when places actually change
  const placesKey = places.join("|||");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (places.length === 0) {
      setIsLoading(false);
      return;
    }

    // Debounce: wait 600 ms after the last places change before fetching.
    // This prevents a burst of partial requests while the AI streams new
    // place names into the semeton-weather block one line at a time.
    timerRef.current = setTimeout(() => {
      setIsLoading(true);
      setFetchError(null);
      setData(null);

      const params = places.map((p) => `place=${encodeURIComponent(p)}`).join("&");

      fetch(`/api/weather?${params}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
          return res.json() as Promise<WeatherResponse>;
        })
        .then((json) => setData(json.places))
        .catch((err) =>
          setFetchError(err instanceof Error ? err.message : "Failed to load weather"),
        )
        .finally(() => setIsLoading(false));
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placesKey]);

  if (places.length === 0) return null;

  if (isLoading) {
    return (
      <span className="flex flex-wrap gap-2 px-1 py-2">
        {places.map((p) => (
          <span
            key={p}
            className="flex animate-pulse items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <span className="h-4 w-4 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <span className="flex flex-col gap-1">
              <span className="h-2.5 w-14 rounded bg-zinc-300 dark:bg-zinc-600" />
              <span className="h-2 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            </span>
          </span>
        ))}
      </span>
    );
  }

  // Fail silently — weather is supplemental; don't break the map or message
  if (fetchError || !data) return null;

  const validPlaces = data.filter((p) => !p.error);
  if (validPlaces.length === 0) return null;

  return (
    <span className="flex flex-wrap gap-2 px-1 py-2">
      {validPlaces.map((place) => (
        <span
          key={place.name}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        >
          <span className="text-base leading-none" aria-hidden>
            {conditionEmoji(place.current.conditionType, place.current.isDaytime)}
          </span>
          <span className="flex flex-col">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {shortLabel(place.name)}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {place.current.tempC}°C · {place.current.conditionText}
            </span>
          </span>
          {place.current.precipPercent > 10 && (
            <span
              className="text-blue-500 dark:text-blue-400"
              title={`${place.current.precipPercent}% chance of rain`}
            >
              💧{place.current.precipPercent}%
            </span>
          )}
        </span>
      ))}
    </span>
  );
}
