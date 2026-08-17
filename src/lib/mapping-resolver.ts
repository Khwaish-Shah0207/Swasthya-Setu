import type { MappingRelationship, NamasteConcept, TerminologyMapping, WHOConceptRef } from "./types";
import { lookupWhoConcept } from "./who-api";
import { computeMappingConfidence } from "./confidence";
import { findManualMappingByAyushCode } from "./db";

// ---------------------------------------------------------------------------
// Mapping resolver
//
//   NAMASTE concept  ->  WHO TM2 lookup  ->  WHO Biomedicine lookup  ->
//   FHIR ConceptMap-shaped TerminologyMapping
//
// Never fabricates a mapping: if the source CSV has no TM2/biomedical code
// for a concept, the corresponding field is returned as null and the UI is
// responsible for rendering "Mapping unavailable".
// ---------------------------------------------------------------------------

function relationshipFor(hasCode: boolean, hasTitle: boolean): MappingRelationship {
  if (!hasCode) return "unmapped";
  return hasTitle ? "equivalent" : "related";
}

export async function resolveMapping(concept: NamasteConcept): Promise<TerminologyMapping> {
  // A manually authored mapping (Terminology Manager -> "+ Add Mapping")
  // takes precedence over the automatically resolved WHO lookup: the
  // manager has explicitly supplied the relationship, confidence, and
  // provenance, so we build the TerminologyMapping directly from it
  // rather than recomputing a heuristic confidence score.
  const manual = await findManualMappingByAyushCode(concept.namasteCode);
  if (manual) {
    const tm2: WHOConceptRef | null = manual.tm2Code
      ? { code: manual.tm2Code, title: manual.tm2Term ?? manual.tm2Code, uri: "", linearization: "TM2", source: "manual-entry" }
      : null;
    const biomedicine: WHOConceptRef | null = manual.icdCode
      ? { code: manual.icdCode, title: manual.icdTerm ?? manual.icdCode, uri: "", linearization: "Biomedicine", source: "manual-entry" }
      : null;

    return {
      namaste: concept,
      tm2,
      biomedicine,
      tm2Relationship: tm2 ? manual.relationship : "unmapped",
      biomedicineRelationship: biomedicine ? manual.relationship : "unmapped",
      confidence: {
        score: manual.confidence,
        band: manual.confidence >= 85 ? "High" : manual.confidence >= 60 ? "Medium" : "Low",
        label: "Swasthya-Setu Mapping Confidence",
        rationale: `Manually entered by the Terminology Manager (source: ${manual.source}, version ${manual.version}).`,
      },
      source: `Terminology Manager — ${manual.source}`,
      lastVerified: manual.createdAt.slice(0, 10),
    };
  }

  const [tm2, biomedicine] = await Promise.all([
    concept.tm2Code ? lookupWhoConcept(concept.tm2Code) : Promise.resolve(null),
    concept.biomedicalCode ? lookupWhoConcept(concept.biomedicalCode) : Promise.resolve(null),
  ]);

  const confidence = computeMappingConfidence(concept);

  return {
    namaste: concept,
    tm2,
    biomedicine,
    tm2Relationship: relationshipFor(Boolean(concept.tm2Code), Boolean(tm2)),
    biomedicineRelationship: relationshipFor(Boolean(concept.biomedicalCode), Boolean(biomedicine)),
    confidence,
    source: "NAMASTE dataset / WHO ICD-11 API",
    lastVerified: new Date().toISOString().slice(0, 10),
  };
}
