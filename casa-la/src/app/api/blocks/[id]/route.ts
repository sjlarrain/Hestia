import { NextResponse } from "next/server";
import { getAuthContext, jsonError } from "@/lib/api-helpers";

/** DELETE /api/blocks/:id — host only. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError("Unauthorized", 401);
  if (ctx.role !== "host") return jsonError("Host only", 403);
  const { id } = await params;

  const { error } = await ctx.service.from("blocks").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ ok: true });
}
