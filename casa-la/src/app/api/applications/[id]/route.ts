import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, jsonError } from "@/lib/api-helpers";
import { isRangeOpenDb, toApplication, type ApplicationGuestRow, type ApplicationRow } from "@/lib/db";
import type { PartyGuest } from "@/lib/types";

type EditBody = Partial<{
  name: string;
  email: string;
  arrival: string;
  departure: string;
  people: number;
  guests: PartyGuest[];
}>;

/** PATCH /api/applications/:id — owner edits their own request pre-approval, or host edits any. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError("Unauthorized", 401);
  const { id } = await params;

  const { data: existing, error: fetchErr } = await ctx.service.from("applications").select("*").eq("id", id).single();
  if (fetchErr || !existing) return jsonError("Request not found", 404);

  const isOwner = existing.user_id === ctx.userId;
  const isHost = ctx.role === "host";
  if (!isOwner && !isHost) return jsonError("Forbidden", 403);
  if (isOwner && !isHost && !["draft", "pending", "rejected"].includes(existing.status)) {
    return jsonError("This request can no longer be edited.", 409);
  }

  const body = (await req.json()) as EditBody;
  const arrival = body.arrival ?? existing.arrival;
  const departure = body.departure ?? existing.departure;
  if (departure < arrival) return jsonError("Departure can't be before arrival.");

  if (["pending", "approved"].includes(existing.status) && (body.arrival || body.departure)) {
    const open = await isRangeOpenDb(ctx.service, arrival, departure, id);
    if (!open) return jsonError("Those dates are no longer available.", 409);
  }

  const { data: updated, error } = await ctx.service
    .from("applications")
    .update({
      name: body.name ?? existing.name,
      email: body.email ?? existing.email,
      arrival,
      departure,
      people: body.people ?? existing.people,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  if (body.guests) {
    await ctx.service.from("application_guests").delete().eq("application_id", id);
    const rows = body.guests.filter((g) => g.name || g.email);
    if (rows.length) {
      await ctx.service.from("application_guests").insert(rows.map((g) => ({ application_id: id, name: g.name || null, email: g.email || null })));
    }
  }

  const { data: guests } = await ctx.service.from("application_guests").select("*").eq("application_id", id);

  return NextResponse.json({
    application: toApplication(updated as ApplicationRow, (guests ?? []) as ApplicationGuestRow[], ctx.userId),
  });
}
