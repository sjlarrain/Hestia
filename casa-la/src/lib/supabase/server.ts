import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Cookie-bound client: runs queries as the signed-in user, so Postgres RLS
 * (see supabase/migrations/0001_init.sql) decides what it can see and write.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render, where cookies can't be written.
          // Harmless as long as session refresh is also handled in middleware.
        }
      },
    },
  });
}

/**
 * Bypasses RLS entirely — service-role key, server-only. Use for the small set
 * of operations that are legitimately cross-user (sanitized availability reads,
 * email_log writes, auth.admin invites), never to skip an authorization check
 * that belongs in the route handler itself.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
