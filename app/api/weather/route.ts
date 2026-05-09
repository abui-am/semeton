import { geocodePlace, getWeather, type WeatherResult } from "@/lib/weather/client";

const MAX_PLACES = 8;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPlaces = searchParams.getAll("place");

  if (rawPlaces.length === 0) {
    return Response.json(
      { error: "Provide at least one ?place= query param." },
      { status: 400 },
    );
  }

  // Dedupe and cap
  const places = [
    ...new Set(rawPlaces.map((p) => p.trim()).filter(Boolean)),
  ].slice(0, MAX_PLACES);

  const results: WeatherResult[] = await Promise.all(
    places.map(async (name): Promise<WeatherResult> => {
      try {
        const { lat, lon, label } = await geocodePlace(name);
        const current = await getWeather(lat, lon);
        return { name: label, lat, lon, current };
      } catch (err) {
        return {
          name,
          lat: 0,
          lon: 0,
          current: {
            tempC: 0,
            feelsLikeC: 0,
            conditionText: "",
            conditionType: "",
            iconBaseUri: "",
            humidity: 0,
            precipPercent: 0,
            windKph: 0,
            isDaytime: true,
          },
          error: err instanceof Error ? err.message : "Weather lookup failed.",
        };
      }
    }),
  );

  return Response.json(
    { places: results },
    {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    },
  );
}
