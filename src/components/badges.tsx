import type { MappingConfidence } from "@/lib/types";

export function SourceBadge({ source }: { source: "namaste" | "tm2" | "biomedicine" | "prototype" }) {
  const map = {
    namaste: { label: "NAMASTE", bg: "var(--color-teal-100)", fg: "var(--color-teal-900)" },
    tm2: { label: "WHO ICD-11 · TM2", bg: "var(--color-gold-100)", fg: "var(--color-gold-700)" },
    biomedicine: { label: "WHO ICD-11 · Biomedicine", bg: "var(--color-slate-100)", fg: "var(--color-slate-700)" },
    prototype: { label: "Swasthya-Setu", bg: "var(--color-surface-sunken)", fg: "var(--color-ink-muted)" },
  }[source];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide"
      style={{ background: map.bg, color: map.fg }}
    >
      {map.label}
    </span>
  );
}

export function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: ok ? "var(--color-success-700)" : "var(--color-danger-700)" }}
        aria-hidden
      />
      {label}
    </span>
  );
}

export function ConfidenceMeter({ confidence }: { confidence: MappingConfidence }) {
  const color =
    confidence.band === "High"
      ? "var(--color-success-700)"
      : confidence.band === "Medium"
      ? "var(--color-gold-700)"
      : "var(--color-danger-700)";
  const bg =
    confidence.band === "High"
      ? "var(--color-success-100)"
      : confidence.band === "Medium"
      ? "var(--color-gold-100)"
      : "var(--color-danger-100)";

  return (
    <div className="flex flex-col gap-1.5" title={confidence.rationale}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-ink-muted)]">{confidence.label}</span>
        <span className="font-mono font-medium" style={{ color }}>
          {confidence.score}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full" style={{ background: bg }}>
        <div
          className="h-1.5 rounded-full transition-standard"
          style={{ width: `${confidence.score}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function MappingBadge({ status }: { status: string }) {
  const ok = status !== "unmapped";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        background: ok ? "var(--color-success-100)" : "var(--color-surface-sunken)",
        color: ok ? "var(--color-success-700)" : "var(--color-ink-muted)",
      }}
    >
      {ok ? "✓" : "—"} {status === "unmapped" ? "Mapping unavailable" : status}
    </span>
  );
}
