"use client";

import { COLORS } from "./tokens";

export default function SelectionBar({
  selRange,
  selNights,
  ctaLabel,
  accent,
  onClear,
  onStart,
}: {
  selRange: string;
  selNights: string;
  ctaLabel: string;
  accent: string;
  onClear: () => void;
  onStart: () => void;
}) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 74, padding: "0 16px", animation: "casaUp .28s ease" }}>
      <div
        style={{
          background: COLORS.ink,
          color: COLORS.bg,
          borderRadius: 16,
          padding: "12px 14px 12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          boxShadow: "0 10px 30px rgba(35,33,28,.28)",
        }}
      >
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 11, color: "#B7AF9E", letterSpacing: 0.5 }}>{selNights}</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{selRange}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            onClick={onClear}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid #444038",
              background: "transparent",
              color: "#B7AF9E",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ×
          </button>
          <button
            onClick={onStart}
            style={{
              padding: "0 16px",
              height: 38,
              borderRadius: 11,
              border: "none",
              background: accent,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
