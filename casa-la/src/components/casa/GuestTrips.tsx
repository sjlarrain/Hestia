"use client";

import type { Application } from "@/lib/types";
import { fmtRange, statusMeta } from "@/lib/casa-logic";
import { COLORS, FONT_SERIF } from "./tokens";
import Badge from "./Badge";

export default function GuestTrips({
  trips,
  accent,
  onEdit,
  onCancel,
  onGoCalendar,
}: {
  trips: Application[];
  accent: string;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onGoCalendar: () => void;
}) {
  return (
    <div style={{ animation: "casaFade .3s ease" }}>
      <h1 style={{ fontFamily: FONT_SERIF, fontWeight: 400, fontSize: 30, lineHeight: 1.1, margin: "2px 0 18px" }}>
        My requests
      </h1>

      {trips.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {trips.map((t) => {
            const meta = statusMeta(t.status);
            const canEdit = ["draft", "pending", "rejected"].includes(t.status);
            const canCancel = ["draft", "pending", "approved"].includes(t.status);
            const partyNote = t.guests.length ? ` · +${t.guests.length} invited` : "";
            const peopleLabel = `${t.people} ${t.people === 1 ? "person" : "people"}${partyNote}`;
            return (
              <div key={t.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: FONT_SERIF, fontSize: 20, lineHeight: 1.1 }}>{fmtRange(t.arrival, t.departure)}</div>
                    <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>{peopleLabel}</div>
                  </div>
                  <Badge meta={meta} />
                </div>
                {(canEdit || canCancel) && (
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    {canEdit && (
                      <button
                        onClick={() => onEdit(t.id)}
                        style={{
                          flex: 1,
                          padding: 9,
                          borderRadius: 10,
                          border: `1px solid ${COLORS.fieldBorder}`,
                          background: COLORS.card,
                          color: "#4A453C",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => onCancel(t.id)}
                        style={{
                          flex: 1,
                          padding: 9,
                          borderRadius: 10,
                          border: `1px solid ${COLORS.declineBorder}`,
                          background: "#FFF",
                          color: COLORS.declineInk,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "56px 20px", color: COLORS.mutedSoft }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 22, color: COLORS.muted }}>No requests yet</div>
          <p style={{ fontSize: 14, margin: "8px 0 20px" }}>Pick your dates on the calendar to get started.</p>
          <button
            onClick={onGoCalendar}
            style={{ padding: "11px 20px", borderRadius: 12, border: "none", background: accent, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Open calendar
          </button>
        </div>
      )}
    </div>
  );
}
