"use client";

import { useState, use as usePromise } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, Eye, PlusCircle, Loader2, CheckCircle2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ConfidenceMeter, MappingBadge } from "@/components/badges";
import { useSession } from "@/lib/session-context";
import type { TerminologyMapping } from "@/lib/types";

export default function AddDiagnosisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const { user } = useSession();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TerminologyMapping[]>([]);
  const [assistedNotice, setAssistedNotice] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, string>>({}); // namasteCode -> conditionId
  const [error, setError] = useState<string | null>(null);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/terminology/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setAssistedNotice(data.assistedNotice ?? null);
    } finally {
      setSearching(false);
    }
  }

  async function addToProblemList(namasteCode: string) {
    setAdding(namasteCode);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${id}/conditions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namasteCode, recordedBy: user?.name ?? "Unknown clinician" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add diagnosis");
        return;
      }
      setAdded((prev) => ({ ...prev, [namasteCode]: data.record.id }));
    } finally {
      setAdding(null);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Add Diagnosis" eyebrow={`Patient ${id}`} description="Search traditional-medicine terminology and generate a dual-coded FHIR entry." />

      <div className="p-8 max-w-4xl space-y-6">
        <Link href={`/patients/${id}`} className="inline-flex items-center gap-1 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-teal-700)]">
          <ArrowLeft size={14} /> Back to patient profile
        </Link>

        <form onSubmit={runSearch} className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search diagnosis… try “sciatica” or “pain shooting down the leg”"
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] pl-9 pr-24 py-3 text-sm outline-none focus:border-[var(--color-teal-500)]"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 rounded-md bg-[var(--color-teal-700)] text-white px-3.5 py-1.5 text-xs font-medium hover:bg-[var(--color-teal-900)] transition-standard"
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : "Search"}
          </button>
        </form>

        {assistedNotice && (
          <div className="rounded-lg border border-[var(--color-gold-500)]/40 bg-[var(--color-gold-100)] px-4 py-2.5 text-xs text-[var(--color-gold-700)]">
            {assistedNotice} Results below are lexical suggestions from the Terminology Search Assistant.
          </div>
        )}

        {error && <p className="text-sm text-[var(--color-danger-700)]">{error}</p>}

        <div className="space-y-4">
          {results.map((mapping) => {
            const code = mapping.namaste.namasteCode;
            const addedId = added[code];
            return (
              <div key={code} className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-xl font-devanagari">{mapping.namaste.sanskritTerm || mapping.namaste.englishName}</p>
                    <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
                      NAMASTE <span className="font-mono">{mapping.namaste.namasteCode}</span> · Traditional diagnosis:{" "}
                      {mapping.namaste.englishName}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--color-ink-muted)] shrink-0">{mapping.namaste.system}</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
                  <div>
                    <p className="text-xs text-[var(--color-ink-muted)]">WHO TM2</p>
                    <p className="mt-0.5">{mapping.tm2 ? `${mapping.tm2.code} — ${mapping.tm2.title}` : <span className="italic text-[var(--color-ink-muted)]">TM2 mapping unavailable</span>}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-ink-muted)]">ICD-11 Biomedicine</p>
                    <p className="mt-0.5">{mapping.biomedicine ? `${mapping.biomedicine.code} — ${mapping.biomedicine.title}` : <span className="italic text-[var(--color-ink-muted)]">Biomedical mapping unavailable</span>}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <MappingBadge status={mapping.biomedicineRelationship} />
                </div>

                <div className="mt-4 max-w-xs">
                  <ConfidenceMeter confidence={mapping.confidence} />
                </div>

                <div className="flex items-center gap-3 mt-5">
                  <Link
                    href={`/terminology/${code}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)] px-3.5 py-2 text-xs font-medium hover:border-[var(--color-teal-500)] transition-standard"
                  >
                    <Eye size={13} /> View Mapping
                  </Link>
                  {addedId ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-success-700)] font-medium">
                      <CheckCircle2 size={14} /> Added to problem list
                    </span>
                  ) : (
                    <button
                      onClick={() => addToProblemList(code)}
                      disabled={adding === code}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-teal-700)] text-white px-3.5 py-2 text-xs font-medium hover:bg-[var(--color-teal-900)] transition-standard disabled:opacity-60"
                    >
                      {adding === code ? <Loader2 size={13} className="animate-spin" /> : <PlusCircle size={13} />}
                      Add to Problem List
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {!searching && results.length === 0 && query.trim() && (
            <p className="text-sm text-[var(--color-ink-muted)]">No matches. Try a different term or symptom phrase.</p>
          )}
        </div>

        {Object.keys(added).length > 0 && (
          <button
            onClick={() => router.push(`/patients/${id}`)}
            className="text-sm text-[var(--color-teal-700)] hover:underline"
          >
            Done — return to patient profile →
          </button>
        )}
      </div>
    </AppShell>
  );
}
