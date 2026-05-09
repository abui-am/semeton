import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableOrAnonKey } from "@/lib/supabase/env";

/** Client Components — call from the browser only. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabasePublishableOrAnonKey(),
  );
}
