"use client";

import type { CSSProperties, ReactNode } from "react";
import { COLORS } from "./tokens";

export function BottomSheet({
  onClose,
  children,
  maxHeight,
  padding = "22px 20px 28px",
}: {
  onClose: () => void;
  children: ReactNode;
  maxHeight?: string;
  padding?: string;
}) {
  const sheetStyle: CSSProperties = {
    width: "100%",
    maxWidth: 440,
    background: COLORS.bg,
    borderRadius: "22px 22px 0 0",
    padding,
    animation: "casaSheet .3s cubic-bezier(.32,.72,0,1)",
  };
  if (maxHeight) {
    sheetStyle.maxHeight = maxHeight;
    sheetStyle.overflowY = "auto";
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30,26,20,.42)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 40,
        animation: "casaFade .2s ease",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} className="cc-scroll" style={sheetStyle}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: "#DED6C6", margin: "0 auto 18px" }} />
        {children}
      </div>
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.muted, letterSpacing: 0.4, marginBottom: 6 }}>
      {children}
    </label>
  );
}

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 12,
  border: `1px solid ${COLORS.fieldBorder}`,
  background: COLORS.card,
  fontSize: 15,
  marginBottom: 14,
};
