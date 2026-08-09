"use client";

import type { BlockFormState } from "@/lib/types";
import { COLORS, FONT_SERIF } from "./tokens";
import { BottomSheet, FieldLabel } from "./ModalShell";

export default function BlockModal({
  form,
  errorText,
  accent,
  onClose,
  onChange,
  onSave,
}: {
  form: BlockFormState;
  errorText: string;
  accent: string;
  onClose: () => void;
  onChange: (patch: Partial<BlockFormState>) => void;
  onSave: () => void;
}) {
  return (
    <BottomSheet onClose={onClose}>
      <h2 style={{ fontFamily: FONT_SERIF, fontWeight: 400, fontSize: 26, margin: "0 0 18px" }}>Block a period</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>From</FieldLabel>
          <input
            value={form.start}
            onChange={(e) => onChange({ start: e.target.value })}
            type="date"
            style={{ width: "100%", padding: 12, borderRadius: 12, border: `1px solid ${COLORS.fieldBorder}`, background: COLORS.card, fontSize: 14 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>To</FieldLabel>
          <input
            value={form.end}
            onChange={(e) => onChange({ end: e.target.value })}
            type="date"
            style={{ width: "100%", padding: 12, borderRadius: 12, border: `1px solid ${COLORS.fieldBorder}`, background: COLORS.card, fontSize: 14 }}
          />
        </div>
      </div>
      <FieldLabel>Reason (optional)</FieldLabel>
      <input
        value={form.reason}
        onChange={(e) => onChange({ reason: e.target.value })}
        placeholder="e.g. Away for work"
        style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: `1px solid ${COLORS.fieldBorder}`, background: COLORS.card, fontSize: 15, marginBottom: 16 }}
      />
      {errorText && <p style={{ color: COLORS.declineInk, fontSize: 13, margin: "0 0 12px" }}>{errorText}</p>}
      <button
        onClick={onSave}
        style={{ width: "100%", padding: 14, borderRadius: 13, border: "none", background: accent, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
      >
        Block these dates
      </button>
    </BottomSheet>
  );
}
