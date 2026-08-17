"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Loader2, AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusDot } from "@/components/badges";
import { AddMappingModal } from "@/components/add-mapping-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useSession } from "@/lib/session-context";
import type { ManualMapping } from "@/lib/types";

interface TerminologyMeta {
  namasteVersion: string;
  namasteRecordCount: number;
  whoIcdVersion: string;
  lastSyncAt: string;
  lastSyncConceptCount: number;
  conceptMapVersion: string;
  lastSyncStatus: string;
  lastSyncMode: string;
}

interface IngestionIssue {
  row: number;
  code: string | null;
  issue: string;
}

export default function AdminPage() {
  const { user } = useSession();
  const [meta, setMeta] = useState<TerminologyMeta | null>(null);
  const [who, setWho] = useState<{ connected: boolean; mode: string; reason?: string | null } | null>(null);
  const [issues, setIssues] = useState<IngestionIssue[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [mappings, setMappings] = useState<ManualMapping[]>([]);
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ManualMapping | null>(null);
  const [deletingMapping, setDeletingMapping] = useState<ManualMapping | null>(null);
  const [deleting, setDeleting] = useState(false);

  function refreshMappings() {
    fetch("/api/terminology/mappings")
      .then((r) => r.json())
      .then((d) => setMappings(d.mappings ?? []));
  }

  function refresh() {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => {
        setMeta(d.terminologyMeta);
        setWho(d.who);
      });
  }

  useEffect(() => {
    refresh();
    refreshMappings();
    fetch("/api/terminology/ingestion-issues")
      .then((r) => r.json())
      .then((d) => setIssues(d.issues ?? []));
  }, []);

  async function runSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/terminology/sync", { method: "POST" });
      const data = await res.json();
      setMeta(data.terminologyMeta);
      setWho(data.who);
    } finally {
      setSyncing(false);
    }
  }

  async function confirmDelete() {
    if (!deletingMapping) return;
    setDeleting(true);
    try {
      await fetch(`/api/terminology/mappings/${deletingMapping.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deletedBy: user?.name ?? "Terminology Manager" }),
      });
      setDeletingMapping(null);
      refreshMappings();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Terminology Manager"
        description="Manage NAMASTE ingestion, WHO synchronization, mapping versions, and manually authored terminology mappings."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddMapping(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] text-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-teal-900)] transition-standard"
            >
              <Plus size={16} /> Add Mapping
            </button>
            <button
              onClick={runSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium hover:border-[var(--color-teal-500)] transition-standard disabled:opacity-60"
            >
              {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Sync WHO Terminology
            </button>
          </div>
        }
      />

      <div className="p-8 max-w-4xl space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
            <p className="font-display text-lg mb-4">Sync status</p>
            <div className="space-y-2 text-sm">
              <StatusDot ok={Boolean(who?.connected) || who?.mode === "snapshot-fallback"} label={who?.connected ? "WHO API — connected (live)" : "WHO API — using snapshot fallback"} />
              {who?.reason && <p className="text-xs text-[var(--color-ink-muted)] pl-4">{who.reason}</p>}
              <p className="text-[var(--color-ink-muted)]">Last synchronization: <span className="text-[var(--color-ink)]">{meta ? new Date(meta.lastSyncAt).toLocaleString() : "—"}</span></p>
              <p className="text-[var(--color-ink-muted)]">Concepts synchronized: <span className="text-[var(--color-ink)]">{meta?.lastSyncConceptCount ?? "—"}</span></p>
              <p className="text-[var(--color-ink-muted)]">Status: <span className="text-[var(--color-ink)] capitalize">{meta?.lastSyncStatus ?? "—"}</span></p>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
            <p className="font-display text-lg mb-4">Version tracking</p>
            <div className="space-y-2 text-sm">
              <p className="text-[var(--color-ink-muted)]">NAMASTE version: <span className="text-[var(--color-ink)]">{meta?.namasteVersion ?? "—"}</span></p>
              <p className="text-[var(--color-ink-muted)]">NAMASTE records: <span className="text-[var(--color-ink)]">{meta?.namasteRecordCount ?? "—"}</span></p>
              <p className="text-[var(--color-ink-muted)]">WHO ICD-11 version: <span className="text-[var(--color-ink)]">{meta?.whoIcdVersion ?? "—"}</span></p>
              <p className="text-[var(--color-ink-muted)]">ConceptMap version: <span className="text-[var(--color-ink)]">{meta?.conceptMapVersion ?? "—"}</span></p>
            </div>
          </div>
        </div>

        {!who?.connected && (
          <div className="rounded-xl border border-[var(--color-gold-500)]/40 bg-[var(--color-gold-100)] p-5 text-sm text-[var(--color-gold-700)] flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p>
              WHO API unavailable — using last synchronized terminology snapshot. Configure{" "}
              <code className="font-mono text-xs">WHO_CLIENT_ID</code> and{" "}
              <code className="font-mono text-xs">WHO_CLIENT_SECRET</code> in your <code className="font-mono text-xs">.env</code> file
              to enable live sync.
            </p>
          </div>
        )}

        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-line)]">
            <div>
              <p className="font-display text-lg">Mapping management</p>
              <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">Manually authored AYUSH → WHO TM2 → WHO ICD-11 mappings.</p>
            </div>
            <button
              onClick={() => setShowAddMapping(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)] px-3 py-2 text-xs font-medium hover:border-[var(--color-teal-500)] transition-standard shrink-0"
            >
              <Plus size={13} /> Add Mapping
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--color-ink-muted)] uppercase tracking-wide bg-[var(--color-surface-sunken)]">
                <th className="px-5 py-3 font-medium">AYUSH</th>
                <th className="px-5 py-3 font-medium">TM2</th>
                <th className="px-5 py-3 font-medium">ICD-11</th>
                <th className="px-5 py-3 font-medium">Relationship</th>
                <th className="px-5 py-3 font-medium">Confidence</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => (
                <tr key={m.id} className="border-t border-[var(--color-line)]">
                  <td className="px-5 py-3">
                    <p className="font-medium">{m.ayushTerm}</p>
                    <p className="font-mono text-xs text-[var(--color-ink-muted)]">{m.ayushCode}</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{m.tm2Code ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs">{m.icdCode ?? "—"}</td>
                  <td className="px-5 py-3 capitalize">{m.relationship}</td>
                  <td className="px-5 py-3 font-mono">{m.confidence}%</td>
                  <td className="px-5 py-3">{m.source}</td>
                  <td className="px-5 py-3 font-mono text-xs">{m.version}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingMapping(m)}
                        aria-label={`Edit mapping for ${m.ayushTerm}`}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-[var(--color-line)] text-[var(--color-ink-muted)] hover:border-[var(--color-teal-500)] hover:text-[var(--color-teal-700)] transition-standard"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeletingMapping(m)}
                        aria-label={`Delete mapping for ${m.ayushTerm}`}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-[var(--color-line)] text-[var(--color-ink-muted)] hover:border-[var(--color-danger-700)] hover:text-[var(--color-danger-700)] transition-standard"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {mappings.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">
                    No manually added mappings yet. Use “Add Mapping” to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showAddMapping && (
          <AddMappingModal
            actingUser={user?.name ?? "Terminology Manager"}
            onClose={() => setShowAddMapping(false)}
            onSaved={() => {
              setShowAddMapping(false);
              refreshMappings();
            }}
          />
        )}

        {editingMapping && (
          <AddMappingModal
            actingUser={user?.name ?? "Terminology Manager"}
            mapping={editingMapping}
            onClose={() => setEditingMapping(null)}
            onSaved={() => {
              setEditingMapping(null);
              refreshMappings();
            }}
          />
        )}

        {deletingMapping && (
          <ConfirmDialog
            title="Delete this mapping?"
            description={`Are you sure you want to delete the mapping for "${deletingMapping.ayushTerm}" (${deletingMapping.ayushCode})? This cannot be undone.`}
            pending={deleting}
            onCancel={() => setDeletingMapping(null)}
            onConfirm={confirmDelete}
          />
        )}

        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
          <p className="font-display text-lg mb-2">NAMASTE ingestion pipeline</p>
          <p className="text-sm text-[var(--color-ink-muted)] mb-4">
            CSV → Parser → Validation → Normalized terminology database → FHIR CodeSystem
          </p>
          {issues.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">No blocking ingestion issues detected.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-auto scrollbar-thin">
              {issues.map((iss, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-ink-muted)] border-t border-[var(--color-line)] pt-1.5 first:border-t-0 first:pt-0">
                  <span className="font-mono shrink-0">{iss.code ?? `row ${iss.row}`}</span>
                  <span>— {iss.issue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
