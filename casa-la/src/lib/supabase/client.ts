import { createBrowserClient } from "@supabase/ssr";

/** Browser client for magic-link sign-in and client-side reads under RLS. */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
