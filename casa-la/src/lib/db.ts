import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Application, AppStatus, PartyGuest } from "./types";

export async function loadApplicationWithGuests(
  service: SupabaseClient,
  id: string,
  currentUserId?: string
): Promise<Application | null> {
  const { data: row } = await service.from("applications").select("*").eq("id", id).single();
  if (!row) return null;
  const { data: guests } = await service.from("application_guests").select("*").eq("application_id", id);
  return toApplication(row as ApplicationRow, (guests ?? []) as ApplicationGuestRow[], currentUserId);
}

export type ApplicationRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  arrival: string;
  departure: string;
  people: number;
  status: AppStatus;
  created_at: string;
  updated_at: string;
};

export type ApplicationGuestRow = {
  id: string;
  application_id: string;
  name: string | null;
  email: string | null;
};

export function toApplication(row: ApplicationRow, guests: ApplicationGuestRow[], currentUserId?: string): Application {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    arrival: row.arrival,
    departure: row.departure,
    people: row.people,
    status: row.status,
    guests: guests.filter((g) => g.application_id === row.id).map((g): PartyGuest => ({ name: g.name || "", email: g.email || "" })),
    mine: currentUserId ? row.user_id === currentUserId : false,
  };
}

/**
 * Interval-overlap check run in SQL rather than casa-logic's per-day loop —
 * equivalent rule (see casa-logic.rangeOpen), just efficient against the DB.
 * Re-run on every submit/approve: the calendar can go stale between a guest
 * selecting a range and the host approving it, so never trust the client.
 */
export async function isRangeOpenDb(
  service: SupabaseClient,
  arrival: string,
  departure: string,
  excludeApplicationId?: string
): Promise<boolean> {
  const { data: blockHit, error: blockErr } = await service
    .from("blocks")
    .select("id")
    .lte("start_date", departure)
    .gte("end_date", arrival)
    .limit(1);
  if (blockErr) throw new Error(blockErr.message);
  if (blockHit && blockHit.length) return false;

  let q = service
    .from("applications")
    .select("id")
    .eq("status", "approved")
    .lte("arrival", departure)
    .gte("departure", arrival);
  if (excludeApplicationId) q = q.neq("id", excludeApplicationId);
  const { data: appHit, error: appErr } = await q.limit(1);
  if (appErr) throw new Error(appErr.message);
  return !(appHit && appHit.length);
}
