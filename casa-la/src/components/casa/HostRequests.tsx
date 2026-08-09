"use client";

import type { Application } from "@/lib/types";
import { fmtRange, statusMeta } from "@/lib/casa-logic";
import { COLORS, FONT_SERIF } from "./tokens";
import Badge from "./Badge";

const STATUS_ORDER: Record<Application["status"], number> = {
  pending: 0,
  approved: 1,
  draft: 2,
  rejected: 3,
  cancelled: 4,
};

export default function HostRequests({
  requests,
  onApprove,
  onReject,
}: {
  requests: Application[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const sorted = [...requests].sort(
    (x, y) => STATUS_ORDER[x.status] - STATUS_ORDER[y.status] || x.arrival.localeCompare(y.arrival)
  );

  return (
    <div style={{ animation: "casaFade .3s ease" }}>
      <h1 style={{ fontFamily: FONT_SERIF, fontWeight: 400, fontSize: 30, lineHeight: 1.1, margin: "2px 0 18px" }}>Requests</h1>

      {sorted.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sorted.map((r) => {
            const meta = statusMeta(r.status);
            const peopleLabel = `${r.people} ${r.people === 1 ? "person" : "people"}`;
            const guestNames = r.guests.map((g) => g.name || g.email).join(", ");
            return (
              <div key={r.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.mutedSoft }}>{r.email}</div>
                  </div>
                  <Badge meta={meta} />
                </div>
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: `1px solid ${COLORS.hairlineSoft}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: COLORS.muted }}>Dates</span>
                    <span style={{ fontWeight: 600 }}>{fmtRange(r.arrival, r.departure)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: COLORS.muted }}>Guests</span>
                    <span style={{ fontWeight: 600 }}>{peopleLabel}</span>
                  </div>
                  {r.guests.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, gap: 10 }}>
                      <span style={{ color: COLORS.muted, flex: "none" }}>Party</span>
                      <span style={{ fontWeight: 600, textAlign: "right" }}>{guestNames}</span>
                    </div>
                  )}
                </div>
                {r.status === "pending" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button
                      onClick={() => onReject(r.id)}
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 11,
                        border: `1px solid ${COLORS.declineBorder}`,
                        background: "#FFF",
                        color: COLORS.declineInk,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => onApprove(r.id)}
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 11,
                        border: "none",
                        background: COLORS.booked,
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color: COLORS.faint, fontSize: 14 }}>No requests yet.</p>
      )}
    </div>
  );
}
