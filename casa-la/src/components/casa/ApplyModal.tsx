"use client";

import type { FormState, PartyGuest } from "@/lib/types";
import { COLORS, FONT_SERIF } from "./tokens";
import { BottomSheet, FieldLabel, inputStyle } from "./ModalShell";

export default function ApplyModal({
  form,
  title,
  submitLabel,
  showDraftBtn,
  errorText,
  accent,
  onClose,
  onChange,
  onAddGuest,
  onUpdateGuest,
  onRemoveGuest,
  onSaveDraft,
  onSubmit,
}: {
  form: FormState;
  title: string;
  submitLabel: string;
  showDraftBtn: boolean;
  errorText: string;
  accent: string;
  onClose: () => void;
  onChange: (patch: Partial<FormState>) => void;
  onAddGuest: () => void;
  onUpdateGuest: (i: number, field: keyof PartyGuest, val: string) => void;
  onRemoveGuest: (i: number) => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}) {
  return (
    <BottomSheet onClose={onClose} maxHeight="92dvh">
      <h2 style={{ fontFamily: FONT_SERIF, fontWeight: 400, fontSize: 26, margin: "0 0 18px" }}>{title}</h2>

      <FieldLabel>Your name</FieldLabel>
      <input value={form.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Full name" style={inputStyle} />

      <FieldLabel>Email</FieldLabel>
      <input
        value={form.email}
        onChange={(e) => onChange({ email: e.target.value })}
        type="email"
        placeholder="you@email.com"
        style={inputStyle}
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>Arrival</FieldLabel>
          <input
            value={form.arrival}
            onChange={(e) => onChange({ arrival: e.target.value })}
            type="date"
            style={{ width: "100%", padding: "12px 12px", borderRadius: 12, border: `1px solid ${COLORS.fieldBorder}`, background: COLORS.card, fontSize: 14, color: COLORS.ink }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>Departure</FieldLabel>
          <input
            value={form.departure}
            onChange={(e) => onChange({ departure: e.target.value })}
            type="date"
            style={{ width: "100%", padding: "12px 12px", borderRadius: 12, border: `1px solid ${COLORS.fieldBorder}`, background: COLORS.card, fontSize: 14, color: COLORS.ink }}
          />
        </div>
      </div>

      <FieldLabel>How many people</FieldLabel>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 20,
          background: COLORS.card,
          border: `1px solid ${COLORS.fieldBorder}`,
          borderRadius: 12,
          padding: "8px 14px",
          width: "fit-content",
        }}
      >
        <button
          onClick={() => onChange({ people: Math.max(1, form.people - 1) })}
          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLORS.fieldBorder}`, background: COLORS.bg, fontSize: 18, cursor: "pointer", color: "#4A453C", lineHeight: 1 }}
        >
          –
        </button>
        <span style={{ fontSize: 18, fontWeight: 600, minWidth: 22, textAlign: "center" }}>{form.people}</span>
        <button
          onClick={() => onChange({ people: Math.min(20, form.people + 1) })}
          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLORS.fieldBorder}`, background: COLORS.bg, fontSize: 18, cursor: "pointer", color: "#4A453C", lineHeight: 1 }}
        >
          ＋
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, letterSpacing: 0.4 }}>Who&apos;s coming with you</label>
        <button onClick={onAddGuest} style={{ fontSize: 13, color: accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
          ＋ Add
        </button>
      </div>

      {form.guests.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {form.guests.map((g, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={g.name}
                onChange={(e) => onUpdateGuest(i, "name", e.target.value)}
                placeholder="Name"
                style={{ flex: 1, padding: "11px 12px", borderRadius: 11, border: `1px solid ${COLORS.fieldBorder}`, background: COLORS.card, fontSize: 14, minWidth: 0 }}
              />
              <input
                value={g.email}
                onChange={(e) => onUpdateGuest(i, "email", e.target.value)}
                placeholder="Email"
                style={{ flex: 1.3, padding: "11px 12px", borderRadius: 11, border: `1px solid ${COLORS.fieldBorder}`, background: COLORS.card, fontSize: 14, minWidth: 0 }}
              />
              <button
                onClick={() => onRemoveGuest(i)}
                style={{ flex: "none", width: 34, height: 34, borderRadius: 9, border: `1px solid ${COLORS.declineBorder}`, background: "#FFF", color: COLORS.declineInk, cursor: "pointer", fontSize: 15 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: COLORS.faint, margin: "0 0 14px" }}>
          Just you, for now. Add family or friends by email to invite them to your stay.
        </p>
      )}

      {errorText && <p style={{ color: COLORS.declineInk, fontSize: 13, margin: "0 0 12px" }}>{errorText}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        {showDraftBtn && (
          <button
            onClick={onSaveDraft}
            style={{ flex: 1, padding: 14, borderRadius: 13, border: `1px solid ${COLORS.fieldBorder}`, background: COLORS.card, color: "#4A453C", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            Save draft
          </button>
        )}
        <button
          onClick={onSubmit}
          style={{ flex: 1.4, padding: 14, borderRadius: 13, border: "none", background: accent, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
        >
          {submitLabel}
        </button>
      </div>
    </BottomSheet>
  );
}
