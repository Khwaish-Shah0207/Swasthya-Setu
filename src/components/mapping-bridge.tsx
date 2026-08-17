import type { TerminologyMapping } from "@/lib/types";
import { MappingBadge, SourceBadge } from "./badges";

function Pier({
  eyebrow,
  code,
  title,
  subtitle,
  tone,
  unavailable,
}: {
  eyebrow: "namaste" | "tm2" | "biomedicine";
  code: string | null;
  title: string;
  subtitle?: string;
  tone: string;
  unavailable?: boolean;
}) {
  return (
    <div className="flex-1 min-w-[180px]">
      <SourceBadge source={eyebrow} />
      <div
        className="mt-3 rounded-lg border p-4"
        style={{
          borderColor: unavailable ? "var(--color-line)" : tone,
          background: unavailable ? "var(--color-surface-sunken)" : "var(--color-surface)",
        }}
      >
        {unavailable ? (
          <p className="text-sm text-[var(--color-ink-muted)] italic">Mapping unavailable</p>
        ) : (
          <>
            <p className="font-mono text-sm" style={{ color: tone }}>
              {code}
            </p>
            <p className="font-display text-lg mt-1 leading-snug">{title}</p>
            {subtitle && <p className="text-sm text-[var(--color-ink-muted)] mt-1 font-devanagari">{subtitle}</p>}
          </>
        )}
      </div>
    </div>
  );
}

/** The bridge span: an SVG arc joining two piers, coloured by whether the span connects. */
function Span({ connected }: { connected: boolean }) {
  return (
    <div className="hidden sm:flex flex-col items-center justify-center px-1 w-14 shrink-0">
      <svg width="56" height="48" viewBox="0 0 56 48" fill="none" aria-hidden>
        <path
          d="M2 40 Q28 4 54 40"
          stroke={connected ? "var(--color-gold-500)" : "var(--color-line)"}
          strokeWidth="2"
          strokeDasharray={connected ? "0" : "4 4"}
          fill="none"
        />
        <circle cx="2" cy="40" r="2.5" fill={connected ? "var(--color-gold-500)" : "var(--color-line)"} />
        <circle cx="54" cy="40" r="2.5" fill={connected ? "var(--color-gold-500)" : "var(--color-line)"} />
      </svg>
    </div>
  );
}

export function MappingBridge({ mapping }: { mapping: TerminologyMapping }) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-0">
        <Pier
          eyebrow="namaste"
          code={mapping.namaste.namasteCode}
          title={mapping.namaste.englishName}
          subtitle={mapping.namaste.sanskritTerm || undefined}
          tone="var(--color-teal-700)"
        />
        <Span connected={Boolean(mapping.tm2)} />
        <Pier
          eyebrow="tm2"
          code={mapping.tm2?.code ?? null}
          title={mapping.tm2?.title ?? ""}
          tone="var(--color-gold-700)"
          unavailable={!mapping.tm2}
        />
        <Span connected={Boolean(mapping.biomedicine)} />
        <Pier
          eyebrow="biomedicine"
          code={mapping.biomedicine?.code ?? null}
          title={mapping.biomedicine?.title ?? ""}
          tone="var(--color-slate-700)"
          unavailable={!mapping.biomedicine}
        />
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <MappingBadge status={mapping.tm2Relationship} />
        <MappingBadge status={mapping.biomedicineRelationship} />
      </div>
    </div>
  );
}
