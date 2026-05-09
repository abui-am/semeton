import { unstable_cache } from "next/cache";

const GEOCODING_API_URL =
  "https://maps.googleapis.com/maps/api/geocode/json";
const WEATHER_API_URL =
  "https://weather.googleapis.com/v1/currentConditions:lookup";

export interface WeatherCurrent {
  tempC: number;
  feelsLikeC: number;
  conditionText: string;
  conditionType: string;
  iconBaseUri: string;
  humidity: number;
  precipPercent: number;
  windKph: number;
  isDaytime: boolean;
}

export interface WeatherResult {
  name: string;
  lat: number;
  lon: number;
  current: WeatherCurrent;
  error?: string;
}

interface GeocodingApiResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
  }>;
}

interface WeatherApiResponse {
  isDaytime?: boolean;
  weatherCondition?: {
    iconBaseUri?: string;
    description?: { text?: string };
    type?: string;
  };
  temperature?: { degrees?: number };
  feelsLikeTemperature?: { degrees?: number };
  relativeHumidity?: number;
  precipitation?: { probability?: { percent?: number } };
  wind?: { speed?: { value?: number } };
}

function apiKey(): string {
  const key = process.env.GOOGLE_ROUTES_API_KEY;
  if (!key?.trim()) {
    throw new Error("GOOGLE_ROUTES_API_KEY is not configured on the server.");
  }
  return key;
}

function normalizePlaceName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

const _geocodePlaceCached = unstable_cache(
  async (normalizedName: string): Promise<{ lat: number; lon: number; label: string }> => {
    const key = apiKey();
    const url =
      `${GEOCODING_API_URL}?address=${encodeURIComponent(normalizedName)}` +
      `&components=country:ID&key=${key}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Google Geocoding API error ${res.status}`);
    }

    const data: GeocodingApiResponse = await res.json();
    if (data.status !== "OK" || !data.results[0]) {
      throw new Error(`No geocoding result for "${normalizedName}" (status: ${data.status})`);
    }

    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lon: lng, label: data.results[0].formatted_address };
  },
  ["weather-geocode"],
  { revalidate: 3600, tags: ["weather-geocode"] },
);

/** Resolves a place name to lat/lng via Google Geocoding API. Results are cached for 1 hour. */
export function geocodePlace(
  name: string,
): Promise<{ lat: number; lon: number; label: string }> {
  return _geocodePlaceCached(normalizePlaceName(name));
}

const _getWeatherCached = unstable_cache(
  async (lat: number, lon: number): Promise<WeatherCurrent> => {
    const key = apiKey();
    const url =
      `${WEATHER_API_URL}?key=${key}` +
      `&location.latitude=${lat}&location.longitude=${lon}`;

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Google Weather API error ${res.status}: ${text}`);
    }

    const data: WeatherApiResponse = await res.json();

    return {
      tempC: Math.round(data.temperature?.degrees ?? 0),
      feelsLikeC: Math.round(data.feelsLikeTemperature?.degrees ?? 0),
      conditionText: data.weatherCondition?.description?.text ?? "Unknown",
      conditionType: data.weatherCondition?.type ?? "UNKNOWN",
      iconBaseUri: data.weatherCondition?.iconBaseUri ?? "",
      humidity: Math.round(data.relativeHumidity ?? 0),
      precipPercent: Math.round(data.precipitation?.probability?.percent ?? 0),
      windKph: Math.round(data.wind?.speed?.value ?? 0),
      isDaytime: data.isDaytime ?? true,
    };
  },
  ["weather-current"],
  { revalidate: 600, tags: ["weather-current"] },
);

/** Fetches current weather conditions via Google Weather API. Results are cached for 10 minutes. */
export function getWeather(lat: number, lon: number): Promise<WeatherCurrent> {
  // Round to 4 decimal places (~11 m precision) to maximise cache hits for nearby coords.
  const rLat = Math.round(lat * 1e4) / 1e4;
  const rLon = Math.round(lon * 1e4) / 1e4;
  return _getWeatherCached(rLat, rLon);
}
