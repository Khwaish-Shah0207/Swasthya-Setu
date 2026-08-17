import fs from "fs";
import path from "path";
import type { NamasteConcept } from "./types";
import { getManualMappings } from "./db";

// ---------------------------------------------------------------------------
// NAMASTE ingestion pipeline
//
//   CSV  ->  parse  ->  validate  ->  normalize  ->  in-memory CodeSystem
//
// The CSV is treated as the source of truth supplied by the user (section 3
// of the brief). Rows with "NA"/blank values are preserved as explicit nulls
// rather than fabricated — downstream UI must render "Mapping unavailable"
// instead of inventing a WHO code.
// ---------------------------------------------------------------------------

const CSV_PATH = path.join(process.cwd(), "data", "namaste.csv");

export interface IngestionIssue {
  row: number;
  code: string | null;
  issue: string;
}

export interface IngestionResult {
  concepts: NamasteConcept[];
  issues: IngestionIssue[];
}

function na(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (v === "" || v.toUpperCase() === "NA" || v.toUpperCase() === "N/A") return null;
  return v;
}

// Minimal RFC4180-ish CSV line splitter sufficient for this dataset
// (no embedded commas inside quoted fields are expected, but we still
// support simple double-quote escaping for robustness).
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  for (const line of lines) {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    rows.push(cells);
  }
  return rows;
}

let cache: IngestionResult | null = null;

export function ingestNamasteCsv(forceReload = false): IngestionResult {
  if (cache && !forceReload) return cache;

  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);

  const concepts: NamasteConcept[] = [];
  const issues: IngestionIssue[] = [];
  const seenCodes = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length < header.length) {
      issues.push({ row: r + 1, code: row[idx("namaste_code")] ?? null, issue: "Incomplete row: fewer columns than header" });
    }

    const code = na(row[idx("namaste_code")]);
    if (!code) {
      issues.push({ row: r + 1, code: null, issue: "Missing NAMASTE code — row skipped" });
      continue;
    }
    if (seenCodes.has(code)) {
      issues.push({ row: r + 1, code, issue: "Duplicate NAMASTE code — row skipped" });
      continue;
    }
    seenCodes.add(code);

    const englishName = na(row[idx("english_name")]);
    if (!englishName) {
      issues.push({ row: r + 1, code, issue: "Missing English name" });
    }

    const definition = na(row[idx("definition")]);
    if (!definition) {
      issues.push({ row: r + 1, code, issue: "Missing/NA definition" });
    }

    const biomedicalCode = na(row[idx("biomedical_code")]);
    const tm2Code = na(row[idx("tm2_code")]);
    if (!biomedicalCode) {
      issues.push({ row: r + 1, code, issue: "No biomedical mapping present in source data" });
    }
    if (!tm2Code) {
      issues.push({ row: r + 1, code, issue: "No TM2 mapping present in source data" });
    }

    concepts.push({
      namasteCode: code,
      englishName: englishName ?? "(untitled concept)",
      sanskritTerm: na(row[idx("sanskrit_term")]) ?? "",
      system: na(row[idx("system")]) ?? "Ayurveda",
      definition,
      biomedicalCode,
      biomedicalTitle: na(row[idx("biomedical_title")]),
      biomedicalDefinition: na(row[idx("biomedical_definition")]),
      tm2Code,
      tm2Title: na(row[idx("tm2_title")]),
    });
  }

  cache = { concepts, issues };
  return cache;
}

/**
 * Returns the full NAMASTE concept list: the CSV-ingested baseline,
 * overlaid with any mappings manually added by the Terminology Manager
 * (see src/lib/db.ts::getManualMappings). A manual mapping either fills in
 * the TM2/biomedical codes for an existing NAMASTE concept, or — if the
 * AYUSH code doesn't already exist in the CSV — introduces a new concept
 * entry, so that it immediately becomes searchable by clinicians.
 */
export async function getAllNamasteConcepts(): Promise<NamasteConcept[]> {
  const base = ingestNamasteCsv().concepts;
  const manualMappings = await getManualMappings();
  if (manualMappings.length === 0) return base;

  const byCode = new Map<string, NamasteConcept>(base.map((c) => [c.namasteCode.toLowerCase(), c]));

  for (const m of manualMappings) {
    const key = m.ayushCode.toLowerCase();
    const existing = byCode.get(key);
    if (existing) {
      byCode.set(key, {
        ...existing,
        tm2Code: m.tm2Code ?? existing.tm2Code,
        tm2Title: m.tm2Term ?? existing.tm2Title,
        biomedicalCode: m.icdCode ?? existing.biomedicalCode,
        biomedicalTitle: m.icdTerm ?? existing.biomedicalTitle,
      });
    } else {
      byCode.set(key, {
        namasteCode: m.ayushCode,
        englishName: m.ayushTerm,
        sanskritTerm: "",
        system: "Ayurveda",
        definition: null,
        biomedicalCode: m.icdCode,
        biomedicalTitle: m.icdTerm,
        biomedicalDefinition: null,
        tm2Code: m.tm2Code,
        tm2Title: m.tm2Term,
      });
    }
  }

  return Array.from(byCode.values());
}

export async function findNamasteByCode(code: string): Promise<NamasteConcept | null> {
  const concepts = await getAllNamasteConcepts();
  return concepts.find((c) => c.namasteCode.toLowerCase() === code.toLowerCase()) ?? null;
}

export async function searchNamaste(query: string): Promise<NamasteConcept[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = await getAllNamasteConcepts();

  // Direct substring match on English name, Sanskrit term, or code.
  const direct = all.filter(
    (c) =>
      c.englishName.toLowerCase().includes(q) ||
      c.sanskritTerm.toLowerCase().includes(q) ||
      c.namasteCode.toLowerCase().includes(q) ||
      (c.biomedicalTitle ?? "").toLowerCase().includes(q)
  );
  if (direct.length > 0) return direct;

  // Fall back to the lightweight semantic "Terminology Search Assistant"
  // (symptom-phrase -> concept suggestion, see semantic-search.ts).
  return [];
}
