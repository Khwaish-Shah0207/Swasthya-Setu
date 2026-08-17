"use client";

import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusDot } from "@/components/badges";

interface StatusData {
  who: { label: string; connected: boolean; mode: string; reason: string | null };
  namaste: { label: string; loaded: boolean; recordCount: number; ingestionIssueCount: number };
  fhir: { label: string; active: boolean; version: string };
  terminologyService: { label: string; operational: boolean; operations: string[] };
  terminologyMeta: { lastSyncAt: string; lastSyncMode: string };
}

function StatusCard({ title, ok, children }: { title: string; ok: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="font-display text-lg">{title}</p>
        <StatusDot ok={ok} label={ok ? "Operational" : "Degraded"} />
      </div>
      {children}
    </div>
  );
}

export default function ApiStatusPage() {
  const [status, setStatus] = useState<StatusData | null>(null);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus);
  }, []);

  return (
    <AppShell>
      <PageHeader title="System Integration / API Status" description="Live status of the WHO ICD-11 connection, NAMASTE dataset, FHIR service, and terminology operations." />

      <div className="p-8 max-w-4xl space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <StatusCard title="WHO ICD-11 API" ok={Boolean(status?.who.connected) || status?.who.mode === "snapshot-fallback"}>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Mode: <span className="text-[var(--color-ink)] font-medium">{status?.who.mode === "live" ? "Live API" : "Snapshot fallback"}</span>
            </p>
            {status?.who.reason && <p className="text-xs text-[var(--color-ink-muted)] mt-1">{status.who.reason}</p>}
          </StatusCard>

          <StatusCard title="NAMASTE Dataset" ok={Boolean(status?.namaste.loaded)}>
            <p className="text-sm text-[var(--color-ink-muted)]">
              {status?.namaste.recordCount ?? "—"} concepts loaded from CSV
            </p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">{status?.namaste.ingestionIssueCount ?? 0} ingestion notes</p>
          </StatusCard>

          <StatusCard title="FHIR R4" ok={Boolean(status?.fhir.active)}>
            <p className="text-sm text-[var(--color-ink-muted)]">Resource version: {status?.fhir.version ?? "R4"}</p>
          </StatusCard>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
          <p className="font-display text-lg mb-3">EMR plugin architecture</p>
          <p className="text-sm text-[var(--color-ink-muted)] mb-4">
            Swasthya-Setu is a terminology interoperability layer, not a hospital-specific EMR. Any
            FHIR-compatible EMR can integrate against it.
          </p>
          <div className="flex flex-col items-center gap-1 text-sm font-mono text-[var(--color-ink-muted)]">
            <span>Hospital EMR A · Hospital EMR B · Hospital EMR C</span>
            <span>↓</span>
            <span className="text-[var(--color-teal-700)] font-semibold">Swasthya-Setu</span>
            <span>↓</span>
            <span>FHIR Terminology Service → NAMASTE + WHO ICD-11</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
