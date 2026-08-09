import { NextResponse } from "next/server";
import { getAuthContext, jsonError } from "@/lib/api-helpers";
import { isRangeOpenDb, loadApplicationWithGuests } from "@/lib/db";
import { makeEmail } from "@/lib/casa-logic";
import { sendAndLog } from "@/lib/email";

/** POST /api/applications/:id/approve — host only; -> approved; fires the guest email. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError("Unauthorized", 401);
  if (ctx.role !== "host") return jsonError("Host only", 403);
  const { id } = await params;

  const { data: existing } = await ctx.service.from("applications").select("*").eq("id", id).single();
  if (!existing) return jsonError("Request not found", 404);
  if (existing.status !== "pending") return jsonError("Only a pending request can be approved.", 409);

  // Re-check: the calendar can go stale between the guest's selection and this approval.
  const open = await isRangeOpenDb(ctx.service, existing.arrival, existing.departure, id);
  if (!open) return jsonError("Those dates were booked by another approved request in the meantime.", 409);

  const { error } = await ctx.service.from("applications").update({ status: "approved" }).eq("id", id);
  if (error) return jsonError(error.message, 500);

  const app = await loadApplicationWithGuests(ctx.service, id);
  if (app) {
    const email = makeEmail("approved", app, ctx.name || undefined);
    await sendAndLog(ctx.service, email, "approved");
  }

  return NextResponse.json({ application: app });
}
