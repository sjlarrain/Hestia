import { NextResponse } from "next/server";
import { getAuthContext, jsonError } from "@/lib/api-helpers";
import { loadApplicationWithGuests } from "@/lib/db";

/** POST /api/applications/:id/cancel — owner or host; -> cancelled. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError("Unauthorized", 401);
  const { id } = await params;

  const { data: existing } = await ctx.service.from("applications").select("*").eq("id", id).single();
  if (!existing) return jsonError("Request not found", 404);
  if (existing.user_id !== ctx.userId && ctx.role !== "host") return jsonError("Forbidden", 403);
  if (!["draft", "pending", "approved"].includes(existing.status)) {
    return jsonError("This request can no longer be cancelled.", 409);
  }

  const { error } = await ctx.service.from("applications").update({ status: "cancelled" }).eq("id", id);
  if (error) return jsonError(error.message, 500);

  const app = await loadApplicationWithGuests(ctx.service, id, ctx.userId);
  return NextResponse.json({ application: app });
}
