"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { ArrowLeft, FileJson, ReceiptText } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import type { ConditionRecord, NamasteConcept, Patient, TerminologyMapping } from "@/lib/types";

interface ProblemListItem {
  record: ConditionRecord;
  concept: NamasteConcept;
  mapping: TerminologyMapping;
}

export default function ProblemListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [problemList, setProblemList] = useState<ProblemListItem[]>([]);

  useEffect(() => {
    fetch(`/api/patients/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setPatient(d.patient);
        setProblemList(d.problemList ?? []);
      });
  }, [id]);

  return (
    <AppShell>
      <PageHeader title="Patient Problem List" eyebrow={patient?.name} description="Dual-coded diagnoses recorded for this patient, with claim-ready coding status." />

      <div className="p-8 max-w-4xl space-y-6">
        <Link href={`/patients/${id}`} className="inline-flex items-center gap-1 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-teal-700)]">
          <ArrowLeft size={14} /> Back to patient profile
        </Link>

        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--color-ink-muted)] uppercase tracking-wide bg-[var(--color-surface-sunken)]">
                <th className="px-5 py-3 font-medium">Diagnosis</th>
                <th className="px-5 py-3 font-medium">NAMASTE</th>
                <th className="px-5 py-3 font-medium">WHO TM2</th>
                <th className="px-5 py-3 font-medium">ICD-11 Biomedicine</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {problemList.map((item) => (
                <tr key={item.record.id} className="border-t border-[var(--color-line)]">
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{item.concept.englishName}</p>
                    <p className="text-xs text-[var(--color-ink-muted)] font-devanagari">{item.concept.sanskritTerm}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs">{item.concept.namasteCode}</td>
                  <td className="px-5 py-3.5 font-mono text-xs">{item.mapping.tm2?.code ?? "—"}</td>
                  <td className="px-5 py-3.5 font-mono text-xs">{item.mapping.biomedicine?.code ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    {item.mapping.tm2 && item.mapping.biomedicine ? (
                      <span className="text-xs text-[var(--color-success-700)] font-medium">✓ Dual coded</span>
                    ) : (
                      <span className="text-xs text-[var(--color-ink-muted)]">Partial coding</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/patients/${id}/fhir/${item.record.id}`} className="inline-flex items-center gap-1 text-xs text-[var(--color-teal-700)] hover:underline">
                      <FileJson size={12} /> FHIR
                    </Link>
                  </td>
                </tr>
              ))}
              {problemList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">
                    No diagnoses recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {problemList.length > 0 && (
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <p className="font-display text-lg flex items-center gap-2 mb-3">
              <ReceiptText size={18} className="text-[var(--color-teal-700)]" /> Claim-ready coding
            </p>
            <p className="text-sm text-[var(--color-ink-muted)] mb-4">
              A demonstration of how standardized dual coding can support downstream interoperability and
              claims workflows. Swasthya-Setu does not integrate directly with any insurance system.
            </p>
            <div className="space-y-2">
              {problemList
                .filter((i) => i.mapping.tm2 && i.mapping.biomedicine)
                .map((i) => (
                  <div key={i.record.id} className="flex items-center justify-between text-sm border border-[var(--color-line)] rounded-lg px-4 py-2.5">
                    <span className="font-mono text-xs">NAMASTE {i.concept.namasteCode}</span>
                    <span className="font-mono text-xs">WHO ICD-11 {i.mapping.biomedicine?.code}</span>
                    <span className="text-xs text-[var(--color-success-700)] font-medium">✓ Dual-coded</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
