"use client";

import { WeatherStrip } from "@/components/weather-strip";

interface MapEmbedProps {
  href: string;
  children: React.ReactNode;
}

/** Parses stop names out of a google.com/maps/dir/... URL. */
function parseDirectionStops(href: string): string[] {
  try {
    const url = new URL(href);
    if (!url.hostname.includes("google.com")) return [];
    const parts = url.pathname.split("/").filter(Boolean);
    const stopIndex = parts.indexOf("dir");
    if (stopIndex === -1) return [];
    return parts
      .slice(stopIndex + 1)
      .map((p) => decodeURIComponent(p.replace(/\+/g, " ")));
  } catch {
    return [];
  }
}

/** Builds a Maps Embed API directions URL from an ordered list of stops. */
function buildEmbedUrl(stops: string[], apiKey: string): string | null {
  if (stops.length < 2) return null;
  const origin = encodeURIComponent(stops[0]);
  const destination = encodeURIComponent(stops[stops.length - 1]);
  const mid = stops.slice(1, -1);
  const waypoints = mid.map(encodeURIComponent).join("|");

  let url =
    `https://www.google.com/maps/embed/v1/directions` +
    `?key=${apiKey}` +
    `&origin=${origin}` +
    `&destination=${destination}` +
    `&mode=driving`;
  if (waypoints) url += `&waypoints=${waypoints}`;
  return url;
}

/**
 * Renders a Google Maps directions link. If the URL is a /maps/dir/ URL and
 * NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY is set, also embeds an interactive iframe.
 */
export function MapEmbed({ href, children }: MapEmbedProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const stops = parseDirectionStops(href);
  const embedUrl = apiKey ? buildEmbedUrl(stops, apiKey) : null;

  const linkClass =
    "inline-flex items-center gap-1 font-medium text-accent underline underline-offset-2 hover:brightness-[0.92]";

  return (
    <span className="my-2 block">
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {children}
      </a>
      {embedUrl && (
        <span className="border-border mt-2 block overflow-hidden rounded-2xl border shadow-[0_8px_24px_-6px_rgba(31,27,22,0.10)]">
          <span className="border-border bg-canvas block border-b px-1">
            <WeatherStrip places={stops} />
          </span>
          <iframe
            src={embedUrl}
            width="100%"
            className="h-[min(50dvh,320px)] w-full max-w-full shrink-0 sm:h-[340px]"
            style={{ border: 0, display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map: ${stops.join(" → ")}`}
          />
        </span>
      )}
    </span>
  );
}
