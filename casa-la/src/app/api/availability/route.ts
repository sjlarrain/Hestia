import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Public-safe calendar data only: block ranges and application date ranges
 * with status but no name/email/party — pending requests belong to someone
 * else and their identity isn't anyone else's business, only the fact that
 * those dates are spoken for. Reads via the service-role client since this is
 * intentionally cross-user; the sanitization happens here, not via RLS.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const service = createServiceRoleClient();

  let blocksQuery = service.from("blocks").select("id, start_date, end_date");
  let rangesQuery = service.from("applications").select("id, status, arrival, departure").in("status", ["approved", "pending"]);

  if (from) {
    blocksQuery = blocksQuery.gte("end_date", from);
    rangesQuery = rangesQuery.gte("departure", from);
  }
  if (to) {
    blocksQuery = blocksQuery.lte("start_date", to);
    rangesQuery = rangesQuery.lte("arrival", to);
  }

  const [{ data: blocks, error: blocksErr }, { data: ranges, error: rangesErr }] = await Promise.all([blocksQuery, rangesQuery]);
  if (blocksErr || rangesErr) {
    return NextResponse.json({ error: (blocksErr ?? rangesErr)?.message ?? "Failed to load availability" }, { status: 500 });
  }

  return NextResponse.json({
    blocks: (blocks ?? []).map((b) => ({ id: b.id, start: b.start_date, end: b.end_date })),
    ranges: (ranges ?? []).map((a) => ({ id: a.id, status: a.status, arrival: a.arrival, departure: a.departure })),
  });
}
