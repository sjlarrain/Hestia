import { NextResponse } from "next/server";
import { getAuthContext, jsonError } from "@/lib/api-helpers";
import { isRangeOpenDb, loadApplicationWithGuests } from "@/lib/db";
import { makeEmail } from "@/lib/casa-logic";
import { sendAndLog } from "@/lib/email";

/** POST /api/applications/:id/submit — owner moves draft -> pending; fires the host email. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError("Unauthorized", 401);
  const { id } = await params;

  const { data: existing } = await ctx.service.from("applications").select("*").eq("id", id).single();
  if (!existing) return jsonError("Request not found", 404);
  if (existing.user_id !== ctx.userId) return jsonError("Forbidden", 403);
  if (existing.status !== "draft") return jsonError("Only a draft can be submitted.", 409);

  const open = await isRangeOpenDb(ctx.service, existing.arrival, existing.departure, id);
  if (!open) return jsonError("Those dates are no longer available.", 409);

  const { error } = await ctx.service.from("applications").update({ status: "pending" }).eq("id", id);
  if (error) return jsonError(error.message, 500);

  const app = await loadApplicationWithGuests(ctx.service, id, ctx.userId);
  if (app) {
    const email = makeEmail("request", app, ctx.name || undefined);
    await sendAndLog(ctx.service, email, "request");
  }

  return NextResponse.json({ application: app });
}
