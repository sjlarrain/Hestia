"use client";

import type { CasaEmail } from "@/lib/types";
import { COLORS } from "./tokens";

export default function EmailModal({
  email,
  accent,
  onClose,
}: {
  email: CasaEmail;
  accent: string;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30,26,20,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 20,
        animation: "casaFade .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 400, background: COLORS.card, borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(30,26,20,.35)", animation: "casaUp .3s ease" }}
      >
        <div style={{ background: accent, padding: "16px 20px", color: "#fff" }}>
          <div style={{ fontSize: 11, opacity: 0.8, letterSpacing: 0.5 }}>FROM CASA · LOS ANGELES</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 3 }}>{email.subject}</div>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.hairlineSoft}`, fontSize: 13, color: COLORS.muted }}>
          To: <span style={{ color: COLORS.ink, fontWeight: 600 }}>{email.to}</span>
        </div>
        <div style={{ padding: 20, fontSize: 14, lineHeight: 1.65, color: "#3A362E", whiteSpace: "pre-line" }}>{email.body}</div>
        <div style={{ padding: "0 20px 20px" }}>
          <button
            onClick={onClose}
            style={{ width: "100%", padding: 13, borderRadius: 12, border: `1px solid ${COLORS.fieldBorder}`, background: COLORS.bg, color: "#4A453C", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
