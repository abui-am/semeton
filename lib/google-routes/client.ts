const ROUTES_API_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

export type TravelMode = "DRIVE" | "WALK" | "BICYCLE" | "TWO_WHEELER";

export interface RouteResult {
  origin: string;
  destination: string;
  travelMode: TravelMode;
  durationSeconds: number;
  /** Human-readable duration, e.g. "25 mins" */
  durationText: string;
  distanceMeters: number;
  /** Human-readable distance, e.g. "14.3 km" */
  distanceText: string;
}

interface RoutesApiResponse {
  routes?: Array<{
    distanceMeters?: number;
    /** Duration proto string, e.g. "1543s" */
    duration?: string;
  }>;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} secs`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m} min${m !== 1 ? "s" : ""}`;
  return `${h} hr ${m} min${m !== 1 ? "s" : ""}`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Calls Google Routes API v2 (server-side only — requires GOOGLE_ROUTES_API_KEY).
 * Returns travel duration and distance between two locations.
 */
export async function computeRoute(
  origin: string,
  destination: string,
  travelMode: TravelMode = "DRIVE",
): Promise<RouteResult> {
  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("GOOGLE_ROUTES_API_KEY is not configured on the server.");
  }

  const body = {
    origin: { address: origin },
    destination: { address: destination },
    travelMode,
    routingPreference: travelMode === "DRIVE" ? "TRAFFIC_AWARE" : undefined,
    computeAlternativeRoutes: false,
  };

  const res = await fetch(ROUTES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
    },
    body: JSON.stringify(body),
    next: { revalidate: 300 }, // cache route result for 5 min
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Google Routes API error ${res.status}: ${text}`);
  }

  const data: RoutesApiResponse = await res.json();
  const route = data.routes?.[0];

  if (!route) {
    throw new Error(
      `No route found between "${origin}" and "${destination}".`,
    );
  }

  const durationSeconds = route.duration
    ? parseInt(route.duration.replace("s", ""), 10)
    : 0;
  const distanceMeters = route.distanceMeters ?? 0;

  return {
    origin,
    destination,
    travelMode,
    durationSeconds,
    durationText: formatDuration(durationSeconds),
    distanceMeters,
    distanceText: formatDistance(distanceMeters),
  };
}
