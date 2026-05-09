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

  const placesKey = places.join("|||");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (places.length === 0) {
      return;
    }

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
        {places.map((p, i) => (
          <span
            key={`${i}:${p}`}
            className="border-border bg-highlight flex animate-pulse items-center gap-2 rounded-xl border px-3 py-1.5"
          >
            <span className="bg-border h-4 w-4 rounded-full" />
            <span className="flex flex-col gap-1">
              <span className="bg-border h-2.5 w-14 rounded" />
              <span className="bg-border h-2 w-20 rounded opacity-70" />
            </span>
          </span>
        ))}
      </span>
    );
  }

  if (fetchError || !data) return null;

  const validPlaces = data.filter((p) => !p.error);
  if (validPlaces.length === 0) return null;

  return (
    <span className="flex flex-wrap gap-2 px-1 py-2">
      {validPlaces.map((place, i) => (
        <span
          key={`${i}:${place.name}`}
          className="border-border bg-card text-ink flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs"
        >
          <span className="text-base leading-none" aria-hidden>
            {conditionEmoji(place.current.conditionType, place.current.isDaytime)}
          </span>
          <span className="flex flex-col">
            <span className="text-ink font-semibold">{shortLabel(place.name)}</span>
            <span className="text-muted">
              {place.current.tempC}°C · {place.current.conditionText}
            </span>
          </span>
          {place.current.precipPercent > 10 && (
            <span
              className="text-accent"
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
