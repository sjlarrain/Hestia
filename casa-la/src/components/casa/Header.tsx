"use client";

import type { CSSProperties } from "react";
import type { Role } from "@/lib/types";
import { COLORS, FONT_SERIF } from "./tokens";

function pillStyle(on: boolean): CSSProperties {
  return {
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 14px",
    borderRadius: 999,
    background: on ? COLORS.card : "transparent",
    color: on ? COLORS.ink : COLORS.muted,
    boxShadow: on ? "0 1px 3px rgba(0,0,0,.08)" : "none",
  };
}

export default function Header({
  role,
  hasPendingForHost,
  onSetRole,
  onOpenInbox,
}: {
  role: Role;
  hasPendingForHost: boolean;
  onSetRole: (r: Role) => void;
  onOpenInbox: () => void;
}) {
  const isHost = role === "host";
  return (
    <header
      style={{
        flex: "none",
        padding: "18px 20px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${COLORS.hairline}`,
        background: COLORS.bg,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: 27, letterSpacing: 0.3, color: COLORS.ink }}>Casa</span>
        <span style={{ fontSize: 10, letterSpacing: 2.4, textTransform: "uppercase", color: COLORS.mutedSoft, marginTop: 3 }}>
          Los Angeles
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={onOpenInbox}
          style={{
            position: "relative",
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: `1px solid ${COLORS.fieldBorder}`,
            background: COLORS.card,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6B6459" strokeWidth="1.7">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          {isHost && hasPendingForHost && (
            <span
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: COLORS.pendingDot,
                border: `2px solid ${COLORS.card}`,
              }}
            />
          )}
        </button>
        <div style={{ display: "flex", background: "#EDE6D8", borderRadius: 999, padding: 3, gap: 2 }}>
          <button onClick={() => onSetRole("guest")} style={pillStyle(!isHost)}>
            Guest
          </button>
          <button onClick={() => onSetRole("host")} style={pillStyle(isHost)}>
            Host
          </button>
        </div>
      </div>
    </header>
  );
}
