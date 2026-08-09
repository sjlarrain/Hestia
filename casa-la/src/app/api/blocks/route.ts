import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, jsonError } from "@/lib/api-helpers";
import { validateBlock } from "@/lib/casa-logic";

/** GET /api/blocks — any signed-in guest (needed to render the calendar). */
export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError("Unauthorized", 401);

  const { data, error } = await ctx.supabase.from("blocks").select("*").order("start_date", { ascending: true });
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({
    blocks: (data ?? []).map((b) => ({ id: b.id, start: b.start_date, end: b.end_date, reason: b.reason })),
  });
}

/** POST /api/blocks — host only. */
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError("Unauthorized", 401);
  if (ctx.role !== "host") return jsonError("Host only", 403);

  const body = (await req.json()) as { start: string; end: string; reason?: string };
  const err = validateBlock({ start: body.start, end: body.end, reason: body.reason ?? "" });
  if (err) return jsonError(err);

  const { data, error } = await ctx.service
    .from("blocks")
    .insert({ start_date: body.start, end_date: body.end, reason: body.reason?.trim() || "Unavailable" })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ block: { id: data.id, start: data.start_date, end: data.end_date, reason: data.reason } }, { status: 201 });
}
