"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import type { Patient } from "@/lib/types";

export default function PatientSearchPage() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/patients?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => setPatients(d.patients))
        .finally(() => setLoading(false));
    }, 150);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <AppShell>
      <PageHeader title="Patient Search" description="Wellness Hospital — demonstration EMR patient roster." />

      <div className="p-8 max-w-4xl">
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, patient ID, or MRN…"
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[var(--color-teal-500)]"
          />
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl overflow-hidden">
          {loading && <p className="px-5 py-4 text-sm text-[var(--color-ink-muted)]">Loading…</p>}
          {!loading && patients.length === 0 && (
            <p className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">No patients match your search.</p>
          )}
          {!loading &&
            patients.map((p, i) => (
              <Link
                key={p.id}
                href={`/patients/${p.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-[var(--color-teal-100)]/40 transition-standard"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-line)" }}
              >
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    {p.id} · MRN {p.mrn} · {p.age}y {p.gender} · Last visit {p.lastVisit}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <ChevronRight size={16} className="text-[var(--color-ink-muted)]" />
                </div>
              </Link>
            ))}
        </div>
      </div>
    </AppShell>
  );
}
