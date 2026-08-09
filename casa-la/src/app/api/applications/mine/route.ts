import { NextResponse } from "next/server";
import { getAuthContext, jsonError } from "@/lib/api-helpers";
import { toApplication, type ApplicationGuestRow, type ApplicationRow } from "@/lib/db";

/** GET /api/applications/mine — the signed-in guest's own requests, any status. */
export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError("Unauthorized", 401);

  const { data: apps, error } = await ctx.supabase
    .from("applications")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("arrival", { ascending: true });
  if (error) return jsonError(error.message, 500);

  const ids = (apps ?? []).map((a) => a.id);
  const { data: guests } = ids.length
    ? await ctx.supabase.from("application_guests").select("*").in("application_id", ids)
    : { data: [] as ApplicationGuestRow[] };

  return NextResponse.json({
    applications: (apps as ApplicationRow[]).map((a) => toApplication(a, guests ?? [], ctx.userId)),
  });
}
