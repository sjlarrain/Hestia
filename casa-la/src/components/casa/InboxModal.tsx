"use client";

import type { CasaEmail } from "@/lib/types";
import { COLORS, FONT_SERIF } from "./tokens";
import { BottomSheet } from "./ModalShell";

export default function InboxModal({
  emails,
  onClose,
  onOpenEmail,
}: {
  emails: CasaEmail[];
  onClose: () => void;
  onOpenEmail: (e: CasaEmail) => void;
}) {
  return (
    <BottomSheet onClose={onClose} maxHeight="80dvh">
      <h2 style={{ fontFamily: FONT_SERIF, fontWeight: 400, fontSize: 26, margin: "0 0 4px" }}>Mail</h2>
      <p style={{ margin: "0 0 18px", color: COLORS.muted, fontSize: 13 }}>
        Notifications sent by Casa. In the live app these arrive by email.
      </p>
      {emails.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {emails.map((e) => (
            <button
              key={e.id}
              onClick={() => onOpenEmail(e)}
              style={{ textAlign: "left", background: COLORS.card, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                <span style={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: e.tagColor, fontWeight: 700 }}>
                  {e.tag}
                </span>
                <span style={{ fontSize: 11, color: COLORS.faint }}>
                  {new Date(e.at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 5 }}>{e.subject}</div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>To {e.to}</div>
            </button>
          ))}
        </div>
      ) : (
        <p style={{ color: COLORS.faint, fontSize: 14 }}>No mail yet.</p>
      )}
    </BottomSheet>
  );
}
