"use client";

import { COLORS } from "./tokens";

export default function Toast({
  text,
  color,
  onTap,
}: {
  text: string;
  color: string;
  onTap: () => void;
}) {
  return (
    <div
      onClick={onTap}
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 90,
        zIndex: 60,
        background: COLORS.ink,
        color: COLORS.bg,
        padding: "12px 18px",
        borderRadius: 999,
        fontSize: 13.5,
        fontWeight: 600,
        boxShadow: "0 10px 30px rgba(35,33,28,.3)",
        animation: "casaUp .3s ease",
        display: "flex",
        alignItems: "center",
        gap: 9,
        cursor: "pointer",
        maxWidth: 400,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flex: "none" }} />
      {text}
    </div>
  );
}
