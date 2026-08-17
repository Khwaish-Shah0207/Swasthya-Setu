import type { ConditionRecord, NamasteConcept, Patient, TerminologyMapping } from "./types";

// ---------------------------------------------------------------------------
// FHIR R4 resource builders
//
// These functions produce realistic (not production-certified) FHIR R4
// JSON so the prototype can demonstrate dual coding, terminology services,
// and downstream EMR bundle upload. System URIs follow the pattern the
// India NRCeS NAMASTE FHIR implementation guide and WHO ICD-11 API use.
// ---------------------------------------------------------------------------

export const NAMASTE_SYSTEM_URI = "https://ayush.gov.in/fhir/CodeSystem/namaste";
export const ICD11_TM2_SYSTEM_URI = "http://id.who.int/icd/release/11/mms/tm2";
export const ICD11_BIOMEDICINE_SYSTEM_URI = "http://id.who.int/icd/release/11/mms";
export const CONCEPTMAP_URI = "https://swasthya-setu.example.org/fhir/ConceptMap/namaste-to-icd11";
export const VALUESET_URI = "https://swasthya-setu.example.org/fhir/ValueSet/namaste-searchable";

export function buildNamasteCodeSystem(concepts: NamasteConcept[]) {
  return {
    resourceType: "CodeSystem",
    id: "namaste",
    url: NAMASTE_SYSTEM_URI,
    version: "v1.2-demo",
    name: "NAMASTE",
    title: "National AYUSH Morbidity & Standardized Terminologies Electronic Codes",
    status: "active",
    experimental: true,
    content: "complete",
    count: concepts.length,
    concept: concepts.map((c) => ({
      code: c.namasteCode,
      display: c.englishName,
      definition: c.definition ?? undefined,
      designation: c.sanskritTerm
        ? [{ language: "sa", value: c.sanskritTerm }]
        : undefined,
    })),
  };
}

export function buildSearchableValueSet(concepts: NamasteConcept[]) {
  return {
    resourceType: "ValueSet",
    id: "namaste-searchable",
    url: VALUESET_URI,
    version: "v1.0",
    name: "NAMASTESearchable",
    title: "Searchable NAMASTE Diagnosis Concepts",
    status: "active",
    compose: {
      include: [
        {
          system: NAMASTE_SYSTEM_URI,
          concept: concepts.map((c) => ({ code: c.namasteCode, display: c.englishName })),
        },
      ],
    },
  };
}

export function buildConceptMap(mappings: TerminologyMapping[]) {
  const elements = mappings
    .filter((m) => m.tm2 || m.biomedicine)
    .map((m) => {
      const targets: Record<string, unknown>[] = [];
      if (m.tm2) {
        targets.push({
          code: m.tm2.code,
          display: m.tm2.title,
          equivalence: m.tm2Relationship === "unmapped" ? "unmatched" : m.tm2Relationship,
          comment: `Swasthya-Setu Mapping Confidence: ${m.confidence.score}% (${m.confidence.band})`,
        });
      }
      if (m.biomedicine) {
        targets.push({
          code: m.biomedicine.code,
          display: m.biomedicine.title,
          equivalence: m.biomedicineRelationship === "unmapped" ? "unmatched" : m.biomedicineRelationship,
          comment: `Swasthya-Setu Mapping Confidence: ${m.confidence.score}% (${m.confidence.band})`,
        });
      }
      return {
        code: m.namaste.namasteCode,
        display: m.namaste.englishName,
        target: targets,
      };
    });

  return {
    resourceType: "ConceptMap",
    id: "namaste-to-icd11",
    url: CONCEPTMAP_URI,
    version: "v1.0",
    name: "NAMASTEToICD11",
    title: "NAMASTE to WHO ICD-11 (TM2 & Biomedicine) Concept Map",
    status: "active",
    experimental: true,
    sourceUri: NAMASTE_SYSTEM_URI,
    group: [
      {
        source: NAMASTE_SYSTEM_URI,
        target: ICD11_BIOMEDICINE_SYSTEM_URI,
        element: elements,
      },
    ],
  };
}

export function buildConditionResource(
  condition: ConditionRecord,
  patient: Patient,
  concept: NamasteConcept,
  mapping: TerminologyMapping
) {
  const coding: Record<string, unknown>[] = [
    {
      system: NAMASTE_SYSTEM_URI,
      code: concept.namasteCode,
      display: concept.englishName,
    },
  ];

  if (mapping.tm2) {
    coding.push({
      system: ICD11_TM2_SYSTEM_URI,
      code: mapping.tm2.code,
      display: mapping.tm2.title,
    });
  }
  if (mapping.biomedicine) {
    coding.push({
      system: ICD11_BIOMEDICINE_SYSTEM_URI,
      code: mapping.biomedicine.code,
      display: mapping.biomedicine.title,
    });
  }

  return {
    resourceType: "Condition",
    id: condition.id,
    meta: {
      profile: ["https://swasthya-setu.example.org/fhir/StructureDefinition/namaste-dual-coded-condition"],
    },
    clinicalStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
          code: condition.clinicalStatus,
        },
      ],
    },
    verificationStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
          code: condition.verificationStatus,
        },
      ],
    },
    code: {
      coding,
      text: concept.englishName,
    },
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.name,
    },
    recordedDate: condition.recordedDate,
    recorder: {
      display: condition.recordedBy,
    },
    extension: [
      {
        url: "https://swasthya-setu.example.org/fhir/StructureDefinition/mapping-confidence",
        valueDecimal: mapping.confidence.score / 100,
      },
    ],
  };
}

export function buildProblemListBundle(
  patient: Patient,
  conditionResources: Record<string, unknown>[]
) {
  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: new Date().toISOString(),
    total: conditionResources.length,
    entry: [
      {
        fullUrl: `Patient/${patient.id}`,
        resource: {
          resourceType: "Patient",
          id: patient.id,
          name: [{ text: patient.name }],
          gender: patient.gender.toLowerCase(),
          identifier: [{ system: "https://swasthya-setu.example.org/mrn", value: patient.mrn }],
        },
      },
      ...conditionResources.map((c) => ({
        fullUrl: `Condition/${(c as { id: string }).id}`,
        resource: c,
      })),
    ],
  };
}
