import { NextResponse } from "next/server";
import { getAuthContext, jsonError } from "@/lib/api-helpers";
import { loadApplicationWithGuests } from "@/lib/db";
import { makeEmail } from "@/lib/casa-logic";
import { sendAndLog } from "@/lib/email";

/** POST /api/applications/:id/reject — host only; -> rejected; fires the guest email. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError("Unauthorized", 401);
  if (ctx.role !== "host") return jsonError("Host only", 403);
  const { id } = await params;

  const { data: existing } = await ctx.service.from("applications").select("*").eq("id", id).single();
  if (!existing) return jsonError("Request not found", 404);
  if (existing.status !== "pending") return jsonError("Only a pending request can be declined.", 409);

  const { error } = await ctx.service.from("applications").update({ status: "rejected" }).eq("id", id);
  if (error) return jsonError(error.message, 500);

  const app = await loadApplicationWithGuests(ctx.service, id);
  if (app) {
    const email = makeEmail("rejected", app, ctx.name || undefined);
    await sendAndLog(ctx.service, email, "rejected");
  }

  return NextResponse.json({ application: app });
}
