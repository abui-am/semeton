import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableOrAnonKey } from "@/lib/supabase/env";

/**
 * Server Components, Server Actions, and Route Handlers — create a fresh client per request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabasePublishableOrAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can be static; cookie mutation is optional when middleware refreshes the session.
          }
        },
      },
    },
  );
}
