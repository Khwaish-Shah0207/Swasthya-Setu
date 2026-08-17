"use client";

import { Loader2, AlertTriangle } from "lucide-react";

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Delete",
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)] shadow-xl p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-danger-100)] text-[var(--color-danger-700)] shrink-0">
            <AlertTriangle size={17} />
          </span>
          <div>
            <p className="font-display text-lg">{title}</p>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onCancel} className="rounded-md px-4 py-2 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-danger-700)] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-standard disabled:opacity-60"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
