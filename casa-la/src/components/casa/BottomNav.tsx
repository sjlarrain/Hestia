"use client";

import { COLORS } from "./tokens";

export type NavTab = {
  id: string;
  label: string;
};

export default function BottomNav({
  tabs,
  active,
  accent,
  onSelect,
}: {
  tabs: NavTab[];
  active: string;
  accent: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      style={{
        flex: "none",
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 74,
        background: "rgba(246,242,234,.92)",
        backdropFilter: "blur(12px)",
        borderTop: `1px solid ${COLORS.hairline}`,
        display: "flex",
        padding: "8px 8px 14px",
      }}
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 2px",
              fontSize: 11,
              fontWeight: 600,
              color: isActive ? COLORS.ink : COLORS.mutedSoft,
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: isActive ? accent : "transparent" }} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
