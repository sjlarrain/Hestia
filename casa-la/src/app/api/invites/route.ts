import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, jsonError } from "@/lib/api-helpers";

/**
 * POST /api/invites — guest or host invites someone by email.
 * Sends Supabase's built-in magic-link invite email (auth.admin.inviteUserByEmail);
 * the new account lands with role='guest' via the handle_new_user() trigger.
 * Configure the invite email template in the Supabase dashboard
 * (Auth -> Email Templates -> Invite user) to match Casa's copy/branding.
 */
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError("Unauthorized", 401);

  const { email } = (await req.json()) as { email?: string };
  if (!email || !/.+@.+\..+/.test(email)) return jsonError("Please provide a valid email.");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const { error } = await ctx.service.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback`,
  });
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ ok: true });
}
