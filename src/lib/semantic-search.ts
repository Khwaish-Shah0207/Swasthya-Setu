import { getAllNamasteConcepts } from "./namaste-loader";
import type { NamasteConcept } from "./types";

// ---------------------------------------------------------------------------
// Terminology Search Assistant
//
// This is a lightweight lexical similarity matcher (token overlap + a small
// hand-authored synonym table) — NOT a medical diagnostic model. It exists
// purely to help a clinician find the right terminology entry when they type
// a symptom phrase instead of a formal term. Every result surfaced by this
// module must be labelled "Terminology suggestion — not a medical diagnosis."
// ---------------------------------------------------------------------------

const SYNONYMS: Record<string, string[]> = {
  "pain shooting down the leg": ["sciatica", "gṛdhrasī", "vata"],
  "leg pain": ["sciatica"],
  "ringing in ears": ["tinnitus", "karna nada"],
  "ear pain": ["earache", "otalgia"],
  "voice change": ["hoarseness", "svarabheda"],
  "loss of taste": ["ageusia", "dysgeusia"],
  "acidity": ["amlapitta", "reflux"],
  "burning stomach": ["amlapitta", "reflux"],
  "fever": ["jwara"],
  "cough": ["kasa"],
  "headache": ["shirashoola"],
  "skin itching": ["vicharchika", "eczema"],
  "high sugar": ["prameha", "diabetes", "madhumeha"],
  "frequent urination": ["prameha", "diabetes"],
  "mental disturbance": ["unmada"],
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export interface SuggestionResult {
  concept: NamasteConcept;
  score: number; // 0-1 lexical similarity
  matchedVia: "synonym-table" | "token-overlap";
}

export async function suggestTerminology(freeText: string, limit = 5): Promise<SuggestionResult[]> {
  const query = freeText.trim().toLowerCase();
  if (!query) return [];

  const concepts = await getAllNamasteConcepts();
  const results: SuggestionResult[] = [];

  // 1. Synonym-table expansion for common symptom phrasing
  let expansionTerms: string[] = [];
  for (const [phrase, expansions] of Object.entries(SYNONYMS)) {
    if (query.includes(phrase) || phrase.includes(query)) {
      expansionTerms = expansionTerms.concat(expansions);
    }
  }

  if (expansionTerms.length > 0) {
    for (const concept of concepts) {
      const hay = `${concept.englishName} ${concept.sanskritTerm} ${concept.namasteCode}`.toLowerCase();
      const hit = expansionTerms.some((t) => hay.includes(t.toLowerCase()));
      if (hit) {
        results.push({ concept, score: 0.9, matchedVia: "synonym-table" });
      }
    }
  }

  if (results.length > 0) {
    return results.slice(0, limit);
  }

  // 2. Fallback: simple token-overlap similarity against name/definition
  const queryTokens = new Set(tokenize(query));
  const scored = concepts
    .map((concept) => {
      const haystack = tokenize(
        `${concept.englishName} ${concept.definition ?? ""} ${concept.biomedicalTitle ?? ""}`
      );
      const overlap = haystack.filter((t) => queryTokens.has(t)).length;
      const score = overlap / Math.max(queryTokens.size, 1);
      return { concept, score, matchedVia: "token-overlap" as const };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
