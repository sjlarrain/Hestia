"use client";

import type { StatusMeta } from "@/lib/casa-logic";

export default function Badge({ meta }: { meta: StatusMeta }) {
  return (
    <span
      style={{
        flex: "none",
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 999,
        color: meta.fg,
        background: meta.bg,
      }}
    >
      {meta.label}
    </span>
  );
}
