"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { MappingBadge } from "@/components/badges";
import type { NamasteConcept, TerminologyMapping } from "@/lib/types";

interface Row {
  concept: NamasteConcept;
  mapping: TerminologyMapping;
}

export default function TerminologySearchPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/terminology/table")
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ concept, mapping }) => {
      const haystack = [
        concept.namasteCode,
        concept.englishName,
        concept.sanskritTerm,
        mapping.tm2?.code,
        mapping.tm2?.title,
        mapping.biomedicine?.code,
        mapping.biomedicine?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query]);

  return (
    <AppShell>
      <PageHeader
        title="Terminology Search"
        description="Existing NAMASTE (Ayurveda, Siddha, Unani) diagnoses mapped to WHO ICD-11 TM2 and Biomedicine."
      />

      <div className="p-8 max-w-6xl space-y-6">
        <div className="relative max-w-lg">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by term, code, e.g. “sciatica”, “AAB-37”, “ME84.3”…"
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[var(--color-teal-500)]"
          />
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--color-ink-muted)] uppercase tracking-wide bg-[var(--color-surface-sunken)]">
                <th className="px-5 py-3 font-medium">AYUSH Term</th>
                <th className="px-5 py-3 font-medium">AYUSH Code</th>
                <th className="px-5 py-3 font-medium">TM2 Term</th>
                <th className="px-5 py-3 font-medium">TM2 Code</th>
                <th className="px-5 py-3 font-medium">ICD-11 Term</th>
                <th className="px-5 py-3 font-medium">ICD-11 Code</th>
                <th className="px-5 py-3 font-medium">Mapping</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ concept, mapping }) => (
                <tr key={concept.namasteCode} className="border-t border-[var(--color-line)]">
                  <td className="px-5 py-3">
                    <p className="font-medium">{concept.englishName}</p>
                    <p className="text-xs text-[var(--color-ink-muted)] font-devanagari">{concept.sanskritTerm}</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{concept.namasteCode}</td>
                  <td className="px-5 py-3">{mapping.tm2?.title ?? <span className="italic text-[var(--color-ink-muted)]">—</span>}</td>
                  <td className="px-5 py-3 font-mono text-xs">{mapping.tm2?.code ?? "—"}</td>
                  <td className="px-5 py-3">{mapping.biomedicine?.title ?? <span className="italic text-[var(--color-ink-muted)]">—</span>}</td>
                  <td className="px-5 py-3 font-mono text-xs">{mapping.biomedicine?.code ?? "—"}</td>
                  <td className="px-5 py-3">
                    <MappingBadge status={mapping.biomedicineRelationship} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/terminology/${concept.namasteCode}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-xs font-medium hover:border-[var(--color-teal-500)] transition-standard"
                    >
                      <Eye size={13} /> View Mapping
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">
                    No terminology matches your filter.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">
                    Loading terminology…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
