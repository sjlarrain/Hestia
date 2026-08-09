import "server-only";
import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "./supabase/server";
import type { Role } from "./types";

export type AuthContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  service: ReturnType<typeof createServiceRoleClient>;
  userId: string;
  role: Role;
  name: string | null;
  email: string;
};

/** Resolves the signed-in user + their public.users profile, or null if unauthenticated. */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("users").select("role, name, email").eq("id", user.id).single();
  if (!profile) return null;

  return {
    supabase,
    service: createServiceRoleClient(),
    userId: user.id,
    role: profile.role as Role,
    name: profile.name,
    email: profile.email,
  };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
