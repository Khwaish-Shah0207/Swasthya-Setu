"use client";

import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import type { AuditEntry } from "@/lib/types";

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  success: { bg: "var(--color-success-100)", fg: "var(--color-success-700)" },
  error: { bg: "var(--color-danger-100)", fg: "var(--color-danger-700)" },
  denied: { bg: "var(--color-gold-100)", fg: "var(--color-gold-700)" },
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    fetch("/api/audit").then((r) => r.json()).then((d) => setEntries(d.entries ?? []));
  }, []);

  return (
    <AppShell>
      <PageHeader title="Audit Log" description="Full record of terminology searches, mapping views, problem-list changes, and system events." />

      <div className="p-8 max-w-5xl">
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--color-ink-muted)] uppercase tracking-wide bg-[var(--color-surface-sunken)]">
                <th className="px-5 py-3 font-medium">Timestamp</th>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Resource</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const style = STATUS_STYLE[e.status] ?? STATUS_STYLE.success;
                return (
                  <tr key={e.id} className="border-t border-[var(--color-line)] align-top">
                    <td className="px-5 py-3 text-xs font-mono whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</td>
                    <td className="px-5 py-3">{e.user}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{e.action.replaceAll("_", " ")}</p>
                      <p className="text-xs text-[var(--color-ink-muted)]">{e.detail}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{e.resource}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: style.bg, color: style.fg }}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">
                    No audit entries yet.
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
