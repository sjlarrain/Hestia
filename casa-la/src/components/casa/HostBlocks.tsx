"use client";

import type { Block } from "@/lib/types";
import { fmtRange } from "@/lib/casa-logic";
import { COLORS, FONT_SERIF } from "./tokens";

export default function HostBlocks({
  blocks,
  accent,
  onAdd,
  onRemove,
}: {
  blocks: Block[];
  accent: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const sorted = [...blocks].sort((x, y) => x.start.localeCompare(y.start));

  return (
    <div style={{ animation: "casaFade .3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "2px 0 18px" }}>
        <h1 style={{ fontFamily: FONT_SERIF, fontWeight: 400, fontSize: 30, lineHeight: 1.1, margin: 0 }}>Blocked</h1>
        <button
          onClick={onAdd}
          style={{ padding: "9px 15px", borderRadius: 11, border: "none", background: accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          ＋ Block dates
        </button>
      </div>
      <p style={{ margin: "0 0 18px", color: "#7C7568", fontSize: 14, lineHeight: 1.5 }}>
        Guests can&apos;t request dates inside these periods.
      </p>

      {sorted.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((b) => (
            <div
              key={b.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: COLORS.card,
                border: `1px solid ${COLORS.hairline}`,
                borderRadius: 14,
                padding: "14px 16px",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{fmtRange(b.start, b.end)}</div>
                <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>{b.reason}</div>
              </div>
              <button
                onClick={() => onRemove(b.id)}
                style={{
                  flex: "none",
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  border: `1px solid ${COLORS.declineBorder}`,
                  background: "#FFF",
                  color: COLORS.declineInk,
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: COLORS.faint, fontSize: 14 }}>No blocked periods.</p>
      )}
    </div>
  );
}
