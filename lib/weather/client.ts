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

/** Resolves a place name to lat/lng via Google Geocoding API. */
export async function geocodePlace(
  name: string,
): Promise<{ lat: number; lon: number; label: string }> {
  const key = apiKey();
  const url =
    `${GEOCODING_API_URL}?address=${encodeURIComponent(name)}` +
    `&components=country:ID&key=${key}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Google Geocoding API error ${res.status}`);
  }

  const data: GeocodingApiResponse = await res.json();
  if (data.status !== "OK" || !data.results[0]) {
    throw new Error(`No geocoding result for "${name}" (status: ${data.status})`);
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lon: lng, label: data.results[0].formatted_address };
}

/** Fetches current weather conditions via Google Weather API. */
export async function getWeather(lat: number, lon: number): Promise<WeatherCurrent> {
  const key = apiKey();
  const url =
    `${WEATHER_API_URL}?key=${key}` +
    `&location.latitude=${lat}&location.longitude=${lon}`;

  const res = await fetch(url, { next: { revalidate: 600 } });
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
}
