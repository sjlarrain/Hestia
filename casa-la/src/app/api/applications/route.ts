import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, jsonError } from "@/lib/api-helpers";
import { isRangeOpenDb, toApplication, type ApplicationGuestRow, type ApplicationRow } from "@/lib/db";
import { makeEmail } from "@/lib/casa-logic";
import { sendAndLog } from "@/lib/email";
import type { PartyGuest } from "@/lib/types";

/** GET /api/applications?status=pending,approved — host only, all requests. */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError("Unauthorized", 401);
  if (ctx.role !== "host") return jsonError("Host only", 403);

  const statusParam = req.nextUrl.searchParams.get("status");
  let query = ctx.service.from("applications").select("*").order("arrival", { ascending: true });
  if (statusParam) query = query.in("status", statusParam.split(","));

  const { data: apps, error } = await query;
  if (error) return jsonError(error.message, 500);

  const ids = (apps ?? []).map((a) => a.id);
  const { data: guests } = ids.length
    ? await ctx.service.from("application_guests").select("*").in("application_id", ids)
    : { data: [] as ApplicationGuestRow[] };

  return NextResponse.json({
    applications: (apps as ApplicationRow[]).map((a) => toApplication(a, guests ?? [], ctx.userId)),
  });
}

type CreateBody = {
  name: string;
  email: string;
  arrival: string;
  departure: string;
  people: number;
  guests?: PartyGuest[];
  submit?: boolean; // guest: false => draft, true => pending (fires host email)
  hostAdd?: boolean; // host only: create pre-approved, no email
};

/** POST /api/applications — guest creates a draft/pending request, or host manually adds a visit. */
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return jsonError("Unauthorized", 401);

  const body = (await req.json()) as CreateBody;
  if (!body.name?.trim()) return jsonError("Please add a name.");
  if (!/.+@.+\..+/.test(body.email ?? "")) return jsonError("Please add a valid email.");
  if (!body.arrival || !body.departure) return jsonError("Please choose dates.");
  if (body.departure < body.arrival) return jsonError("Departure can't be before arrival.");

  const hostAdd = ctx.role === "host" && body.hostAdd === true;
  const status = hostAdd ? "approved" : body.submit ? "pending" : "draft";

  if (status === "pending" || status === "approved") {
    const open = await isRangeOpenDb(ctx.service, body.arrival, body.departure);
    if (!open) return jsonError("Those dates are no longer available.", 409);
  }

  const { data: inserted, error } = await ctx.service
    .from("applications")
    .insert({
      user_id: ctx.userId,
      name: body.name.trim(),
      email: body.email.trim(),
      arrival: body.arrival,
      departure: body.departure,
      people: body.people ?? 1,
      status,
    })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  const guestRows = (body.guests ?? []).filter((g) => g.name || g.email);
  if (guestRows.length) {
    await ctx.service.from("application_guests").insert(
      guestRows.map((g) => ({ application_id: inserted.id, name: g.name || null, email: g.email || null }))
    );
  }

  const app = toApplication(inserted as ApplicationRow, guestRows.map((g, i) => ({ id: String(i), application_id: inserted.id, name: g.name, email: g.email })), ctx.userId);

  if (status === "pending") {
    const email = makeEmail("request", app, ctx.name || undefined);
    await sendAndLog(ctx.service, email, "request");
  }

  return NextResponse.json({ application: app }, { status: 201 });
}
