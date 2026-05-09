/** Parses the project ref from `NEXT_PUBLIC_SUPABASE_URL`, e.g. `https://abc.supabase.co` → `abc`. */
export function getSupabaseProjectRefFromEnv(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const suffix = ".supabase.co";
    if (!host.endsWith(suffix) || host.length <= suffix.length) return null;
    return host.slice(0, -suffix.length);
  } catch {
    return null;
  }
}
