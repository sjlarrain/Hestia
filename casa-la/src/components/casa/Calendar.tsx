"use client";

import type { CSSProperties } from "react";
import type { CalendarCell } from "@/lib/casa-logic";
import { COLORS, FONT_SERIF } from "./tokens";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function cellStyle(cell: CalendarCell, accent: string): CSSProperties {
  if (cell.empty) return { height: 46 };

  let bg = "transparent";
  let color = "#3A362E";
  let border = "1px solid transparent";
  let cursor: CSSProperties["cursor"] = "default";
  let weight: CSSProperties["fontWeight"] = 500;
  let opacity = 1;

  if (cell.isStart || cell.isEnd) {
    bg = accent;
    color = "#fff";
    weight = 700;
    cursor = "pointer";
  } else if (cell.inRange) {
    bg = "rgba(184,92,56,.14)";
    color = "#8B4A2C";
    cursor = "pointer";
  } else if (cell.blocked) {
    bg = `repeating-linear-gradient(-45deg,${COLORS.blockedStripeA},${COLORS.blockedStripeA} 3px,${COLORS.blockedStripeB} 3px,${COLORS.blockedStripeB} 6px)`;
    color = COLORS.faint;
  } else if (cell.past) {
    color = "#CFC7B6";
  } else if (cell.approved) {
    bg = COLORS.bookedSoft;
    color = COLORS.bookedInk;
  } else if (cell.clickable) {
    bg = COLORS.card;
    border = "1px solid #ECE5D8";
    cursor = "pointer";
  }

  if (cell.past && !cell.isStart && !cell.inRange) opacity = 0.85;

  return {
    position: "relative",
    height: 46,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    fontSize: 15,
    background: bg,
    color,
    border,
    cursor,
    fontWeight: weight,
    opacity,
    userSelect: "none",
  };
}

function dotStyle(cell: CalendarCell): CSSProperties {
  if (cell.isStart || cell.isEnd || cell.inRange) return { display: "none" };
  const c = cell.approved ? COLORS.booked : cell.pending ? COLORS.pendingDot : null;
  if (!c) return { display: "none" };
  return {
    position: "absolute",
    bottom: 6,
    left: "50%",
    transform: "translateX(-50%)",
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: c,
  };
}

export default function Calendar({
  monthLabel,
  cells,
  accent,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  showLegend = true,
}: {
  monthLabel: string;
  cells: CalendarCell[];
  accent: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (iso: string) => void;
  showLegend?: boolean;
}) {
  const navBtn: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: `1px solid ${COLORS.fieldBorder}`,
    background: COLORS.card,
    cursor: "pointer",
    color: "#6B6459",
    fontSize: 18,
    lineHeight: 1,
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={onPrevMonth} style={navBtn}>
          ‹
        </button>
        <span style={{ fontFamily: FONT_SERIF, fontSize: 21 }}>{monthLabel}</span>
        <button onClick={onNextMonth} style={navBtn}>
          ›
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
        {WEEKDAYS.map((w, i) => (
          <span
            key={i}
            style={{ textAlign: "center", fontSize: 11, letterSpacing: 0.5, color: COLORS.faint, textTransform: "uppercase" }}
          >
            {w}
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((cell) => (
          <div
            key={cell.key}
            style={cellStyle(cell, accent)}
            onClick={cell.clickable && cell.iso ? () => onDayClick(cell.iso as string) : undefined}
          >
            <span>{cell.label}</span>
            <span style={dotStyle(cell)} />
          </div>
        ))}
      </div>

      {showLegend && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 18, fontSize: 12, color: "#7C7568" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: COLORS.booked }} />
            Booked
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: COLORS.pendingDot }} />
            Pending
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: "#DED6C6" }} />
            Blocked
          </span>
        </div>
      )}
    </div>
  );
}
