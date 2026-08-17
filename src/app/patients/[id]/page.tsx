"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { MappingBadge } from "@/components/badges";
import type { ConditionRecord, NamasteConcept, Patient, TerminologyMapping } from "@/lib/types";

interface ProblemListItem {
  record: ConditionRecord;
  concept: NamasteConcept;
  mapping: TerminologyMapping;
}

export default function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [problemList, setProblemList] = useState<ProblemListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  function refresh() {
    setLoading(true);
    fetch(`/api/patients/${id}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setPatient(d.patient);
        setProblemList(d.problemList);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <AppShell>
      <PageHeader
        title={loading ? "Loading patient…" : notFound ? "Patient not found" : patient?.name ?? ""}
        eyebrow={patient ? `Patient ID ${patient.id} · MRN ${patient.mrn}` : undefined}
        description={patient ? `${patient.age}y · ${patient.gender} · Last visit ${patient.lastVisit}` : undefined}
        actions={
          patient && (
            <Link
              href={`/patients/${id}/add-diagnosis`}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] text-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-teal-900)] transition-standard"
            >
              <PlusCircle size={16} /> Add Diagnosis
            </Link>
          )
        }
      />

      <div className="p-8 max-w-4xl space-y-6">
        <Link href="/patients" className="inline-flex items-center gap-1 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-teal-700)]">
          <ArrowLeft size={14} /> Back to patient search
        </Link>

        {notFound && (
          <div className="rounded-xl border border-[var(--color-danger-700)]/30 bg-[var(--color-danger-100)] p-5 text-sm text-[var(--color-danger-700)]">
            No patient exists with ID {id}.
          </div>
        )}

        {patient && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-display text-lg">Problem List</p>
              <Link href={`/patients/${id}/problem-list`} className="text-sm text-[var(--color-teal-700)] hover:underline">
                Open full view
              </Link>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl overflow-hidden">
              {problemList.length === 0 && (
                <p className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">
                  No diagnoses recorded yet. Use “Add Diagnosis” to search NAMASTE terminology and create the
                  first dual-coded problem list entry.
                </p>
              )}
              {problemList.map((item, i) => (
                <div key={item.record.id} className="px-5 py-4" style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-line)" }}>
                  <div>
                    <p className="font-display text-base font-devanagari">{item.concept.sanskritTerm || item.concept.englishName}</p>
                    <p className="text-sm text-[var(--color-ink-muted)]">{item.concept.englishName}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs">
                    <div>
                      <p className="text-[var(--color-ink-muted)]">AYUSH / NAMASTE</p>
                      <p className="font-mono mt-0.5">{item.concept.namasteCode}</p>
                    </div>
                    <div>
                      <p className="text-[var(--color-ink-muted)]">WHO TM2</p>
                      <p className="font-mono mt-0.5">{item.mapping.tm2?.code ?? "Mapping unavailable"}</p>
                    </div>
                    <div>
                      <p className="text-[var(--color-ink-muted)]">ICD-11 Biomedicine</p>
                      <p className="font-mono mt-0.5">
                        {item.mapping.biomedicine ? `${item.mapping.biomedicine.code} — ${item.mapping.biomedicine.title}` : "Mapping unavailable"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <MappingBadge status={item.mapping.tm2 && item.mapping.biomedicine ? "equivalent" : "unmapped"} />
                    {item.mapping.tm2 && item.mapping.biomedicine && (
                      <span className="text-xs text-[var(--color-teal-700)] font-medium">✓ Dual coded</span>
                    )}
                    <span className="text-xs text-[var(--color-ink-muted)] ml-auto">Added {item.record.recordedDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
