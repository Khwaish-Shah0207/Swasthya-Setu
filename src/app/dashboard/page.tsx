"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, RefreshCw, ArrowRight } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useSession } from "@/lib/session-context";
import { StatusDot } from "@/components/badges";

interface StatusResponse {
  who: { connected: boolean; mode: string };
  namaste: { loaded: boolean; recordCount: number };
  fhir: { active: boolean };
  terminologyService: { operational: boolean };
}

export default function DashboardPage() {
  const { user } = useSession();
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus);
  }, []);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Swasthya-Setu · FHIR Terminology Interoperability Layer"
        title={`Welcome, ${user?.name.split(" ")[0] ?? ""}`}
        description="A FHIR-compliant integration layer that bridges NAMASTE (Ayurveda, Siddha, Unani) terminology with WHO ICD-11 TM2 and Biomedicine — pluggable into any FHIR-compatible EMR."
      />

      <div className="p-8 space-y-8 max-w-6xl">
        <div className="flex flex-wrap gap-3">
          {user?.role === "clinician" && (
            <>
              <Link
                href="/terminology"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] text-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-teal-900)] transition-standard"
              >
                <Search size={16} /> Search Diagnosis
              </Link>
              <Link
                href="/patients"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium hover:border-[var(--color-teal-500)] transition-standard"
              >
                <Users size={16} /> View Patient
              </Link>
            </>
          )}
          {user?.role === "admin" && (
            <>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] text-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-teal-900)] transition-standard"
              >
                <RefreshCw size={16} /> Terminology Sync &amp; Mapping Management
              </Link>
              <Link
                href="/terminology"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium hover:border-[var(--color-teal-500)] transition-standard"
              >
                <Search size={16} /> Terminology Search
              </Link>
            </>
          )}
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
          <p className="font-display text-lg mb-4">System status</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusDot ok={Boolean(status?.who.connected) || status?.who.mode === "snapshot-fallback"} label="WHO ICD-11 API" />
            <StatusDot ok={Boolean(status?.namaste.loaded)} label="NAMASTE Dataset" />
            <StatusDot ok={Boolean(status?.fhir.active)} label="FHIR R4" />
            <StatusDot ok={Boolean(status?.terminologyService.operational)} label="Terminology Service" />
          </div>
          <Link href="/api-status" className="inline-flex items-center gap-1 text-sm text-[var(--color-teal-700)] mt-4 hover:underline">
            View full integration status <ArrowRight size={14} />
          </Link>
        </div>

        <div className="rounded-xl border border-[var(--color-gold-500)]/40 bg-[var(--color-gold-100)] p-5">
          <p className="text-sm text-[var(--color-gold-700)] font-medium">Not a hospital EMR</p>
          <p className="text-sm text-[var(--color-ink)] mt-1 max-w-3xl">
            Swasthya-Setu is a terminology interoperability plugin/microservice, not a standalone hospital
            information system. It sits between any FHIR-compatible EMR and NAMASTE + WHO ICD-11, and this
            interface demonstrates that flow end-to-end using a mock EMR — Wellness Hospital.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
