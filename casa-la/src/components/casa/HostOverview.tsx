"use client";

import { COLORS, FONT_SERIF } from "./tokens";

export type ArrivalDeparture = {
  id: string;
  day: number;
  mon: string;
  name: string;
  meta: string;
};

const cardStyle = {
  background: COLORS.card,
  border: `1px solid ${COLORS.hairline}`,
  borderRadius: 13,
  padding: "12px 14px",
} as const;

function Row({ item }: { item: ArrivalDeparture }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, ...cardStyle }}>
      <div style={{ flex: "none", width: 44, textAlign: "center" }}>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 20, lineHeight: 1 }}>{item.day}</div>
        <div style={{ fontSize: 10, textTransform: "uppercase", color: COLORS.mutedSoft, letterSpacing: 1 }}>{item.mon}</div>
      </div>
      <div style={{ flex: 1, borderLeft: `1px solid ${COLORS.hairlineSoft}`, paddingLeft: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</div>
        <div style={{ fontSize: 12, color: COLORS.muted }}>{item.meta}</div>
      </div>
    </div>
  );
}

export default function HostOverview({
  todayLabel,
  hostFirst,
  hereNow,
  pendingCount,
  upcomingCount,
  arrivals,
  departures,
  onGoRequests,
}: {
  todayLabel: string;
  hostFirst: string;
  hereNow: number;
  pendingCount: number;
  upcomingCount: number;
  arrivals: ArrivalDeparture[];
  departures: ArrivalDeparture[];
  onGoRequests: () => void;
}) {
  return (
    <div style={{ animation: "casaFade .3s ease" }}>
      <p style={{ margin: "2px 0 2px", color: COLORS.mutedSoft, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
        {todayLabel}
      </p>
      <h1 style={{ fontFamily: FONT_SERIF, fontWeight: 400, fontSize: 30, lineHeight: 1.1, margin: "0 0 18px" }}>
        Hello, {hostFirst}
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 22 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "14px 12px" }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 30, lineHeight: 1 }}>{hereNow}</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>Here now</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "14px 12px" }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 30, lineHeight: 1, color: "#8A5A16" }}>{pendingCount}</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>Pending</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "14px 12px" }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 30, lineHeight: 1 }}>{upcomingCount}</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>Upcoming</div>
        </div>
      </div>

      {pendingCount > 0 && (
        <button
          onClick={onGoRequests}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#FBF0DA",
            border: "1px solid #F0DFB8",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 22,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: 14, color: "#7A5310", fontWeight: 600 }}>
            {pendingCount} request{pendingCount === 1 ? "" : "s"} awaiting your reply
          </span>
          <span style={{ color: "#7A5310", fontSize: 18 }}>›</span>
        </button>
      )}

      <h2 style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: COLORS.mutedSoft, margin: "0 0 10px" }}>
        Arriving soon
      </h2>
      {arrivals.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
          {arrivals.map((a) => (
            <Row key={a.id} item={a} />
          ))}
        </div>
      ) : (
        <p style={{ color: COLORS.faint, fontSize: 14, margin: "0 0 22px" }}>Nobody scheduled yet.</p>
      )}

      <h2 style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: COLORS.mutedSoft, margin: "0 0 10px" }}>
        Departing soon
      </h2>
      {departures.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {departures.map((d) => (
            <Row key={d.id} item={d} />
          ))}
        </div>
      ) : (
        <p style={{ color: COLORS.faint, fontSize: 14, margin: 0 }}>Nobody scheduled yet.</p>
      )}
    </div>
  );
}
