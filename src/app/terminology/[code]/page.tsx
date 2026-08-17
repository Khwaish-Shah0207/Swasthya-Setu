"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { MappingBridge } from "@/components/mapping-bridge";
import { ConfidenceMeter } from "@/components/badges";
import type { TerminologyMapping } from "@/lib/types";

export default function MappingDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = usePromise(params);
  const [mapping, setMapping] = useState<TerminologyMapping | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/terminology/namaste/${code}`)
      .then(async (r) => {
        if (!r.ok) {
          setError("NAMASTE concept not found.");
          return null;
        }
        return r.json();
      })
      .then((d) => d && setMapping(d));
  }, [code]);

  return (
    <AppShell>
      <PageHeader title="Mapping Detail" eyebrow={`NAMASTE ${code}`} description="NAMASTE → WHO ICD-11 TM2 → WHO ICD-11 Biomedicine relationship." />

      <div className="p-8 max-w-4xl space-y-6">
        <Link href="/terminology" className="inline-flex items-center gap-1 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-teal-700)]">
          <ArrowLeft size={14} /> Back to terminology search
        </Link>

        {error && <p className="text-sm text-[var(--color-danger-700)]">{error}</p>}

        {mapping && (
          <>
            <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
              <MappingBridge mapping={mapping} />
            </div>

            {mapping.namaste.definition && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
                <p className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)] mb-2">NAMASTE definition</p>
                <p className="text-sm leading-relaxed">{mapping.namaste.definition}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
                <p className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)] mb-3">Mapping confidence</p>
                <ConfidenceMeter confidence={mapping.confidence} />
                <p className="text-xs text-[var(--color-ink-muted)] mt-3">{mapping.confidence.rationale}</p>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">Source</p>
                  <p className="mt-0.5">{mapping.source}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">Last verified</p>
                  <p className="mt-0.5">{mapping.lastVerified}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">TM2 relationship</p>
                  <p className="mt-0.5 capitalize">{mapping.tm2Relationship}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">Biomedicine relationship</p>
                  <p className="mt-0.5 capitalize">{mapping.biomedicineRelationship}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
