"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { ManualMapping, MappingRelationship } from "@/lib/types";

const RELATIONSHIPS: { value: MappingRelationship; label: string }[] = [
  { value: "equivalent", label: "Equivalent" },
  { value: "related", label: "Related" },
  { value: "broader", label: "Broader" },
  { value: "narrower", label: "Narrower" },
  { value: "uncertain", label: "Uncertain" },
];

const SOURCES = ["Official Mapping", "Admin Added", "Imported Dataset", "AI Suggested"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal-500)]";

export function AddMappingModal({
  actingUser,
  mapping,
  onClose,
  onSaved,
}: {
  /** Name of the currently signed-in Terminology Manager, recorded as createdBy/updatedBy. */
  actingUser: string;
  /** When provided, the modal opens in edit mode pre-filled with this mapping's data. */
  mapping?: ManualMapping;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(mapping);
  const [ayushCode, setAyushCode] = useState(mapping?.ayushCode ?? "");
  const [ayushTerm, setAyushTerm] = useState(mapping?.ayushTerm ?? "");
  const [tm2Code, setTm2Code] = useState(mapping?.tm2Code ?? "");
  const [tm2Term, setTm2Term] = useState(mapping?.tm2Term ?? "");
  const [icdCode, setIcdCode] = useState(mapping?.icdCode ?? "");
  const [icdTerm, setIcdTerm] = useState(mapping?.icdTerm ?? "");
  const [relationship, setRelationship] = useState<MappingRelationship>(mapping?.relationship ?? "related");
  const [confidence, setConfidence] = useState(mapping?.confidence ?? 90);
  const [source, setSource] = useState(mapping?.source ?? SOURCES[1]);
  const [version, setVersion] = useState(mapping?.version ?? "1.0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!ayushCode.trim() || !ayushTerm.trim()) {
      setError("AYUSH code and term are required.");
      return;
    }
    if (!tm2Code.trim() && !icdCode.trim()) {
      setError("Provide at least a WHO TM2 code or a WHO ICD-11 Biomedicine code.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ayushCode: ayushCode.trim(),
        ayushTerm: ayushTerm.trim(),
        tm2Code: tm2Code.trim() || null,
        tm2Term: tm2Term.trim() || null,
        icdCode: icdCode.trim() || null,
        icdTerm: icdTerm.trim() || null,
        relationship,
        confidence,
        source,
        version: version.trim() || "1.0",
      };

      const res = await fetch(
        isEdit ? `/api/terminology/mappings/${mapping!.id}` : "/api/terminology/mappings",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit ? { ...payload, updatedBy: actingUser } : { ...payload, createdBy: actingUser }
          ),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save mapping");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto scrollbar-thin rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)] shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-line)]">
          <p className="font-display text-lg">{isEdit ? "Edit Mapping" : "Add Mapping"}</p>
          <button onClick={onClose} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-teal-700)] font-medium mb-2">AYUSH / NAMASTE</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="AYUSH Code">
                <input className={inputClass} value={ayushCode} onChange={(e) => setAyushCode(e.target.value)} placeholder="e.g. AAB-37" />
              </Field>
              <Field label="AYUSH Term">
                <input className={inputClass} value={ayushTerm} onChange={(e) => setAyushTerm(e.target.value)} placeholder="e.g. Gṛdhrasī" />
              </Field>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-gold-700)] font-medium mb-2">WHO TM2</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="TM2 Code">
                <input className={inputClass} value={tm2Code} onChange={(e) => setTm2Code(e.target.value)} placeholder="e.g. TM2-SP70" />
              </Field>
              <Field label="TM2 Term">
                <input className={inputClass} value={tm2Term} onChange={(e) => setTm2Term(e.target.value)} placeholder="e.g. Vata vyadhi affecting lower limb" />
              </Field>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-slate-700)] font-medium mb-2">WHO ICD-11 Biomedicine</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="ICD-11 Code">
                <input className={inputClass} value={icdCode} onChange={(e) => setIcdCode(e.target.value)} placeholder="e.g. ME84.3" />
              </Field>
              <Field label="ICD-11 Term">
                <input className={inputClass} value={icdTerm} onChange={(e) => setIcdTerm(e.target.value)} placeholder="e.g. Sciatica" />
              </Field>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Mapping Relationship">
              <select className={inputClass} value={relationship} onChange={(e) => setRelationship(e.target.value as MappingRelationship)}>
                {RELATIONSHIPS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mapping Confidence (%)">
              <input
                type="number"
                min={0}
                max={100}
                className={inputClass}
                value={confidence}
                onChange={(e) => setConfidence(Math.max(0, Math.min(100, Number(e.target.value))))}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Mapping Source">
              <select className={inputClass} value={source} onChange={(e) => setSource(e.target.value)}>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Version">
              <input className={inputClass} value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0" />
            </Field>
          </div>

          {error && <p className="text-sm text-[var(--color-danger-700)]">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-line)]">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] text-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-teal-900)] transition-standard disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Save Mapping"}
          </button>
        </div>
      </div>
    </div>
  );
}
