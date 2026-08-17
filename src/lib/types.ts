export type Role = "clinician" | "admin" | "analytics";

export interface AppUser {
  id: string;
  name: string;
  role: Role;
  designation: string;
  hospital: string;
  username: string;
}

export interface NamasteConcept {
  namasteCode: string;
  englishName: string;
  sanskritTerm: string;
  system: string;
  definition: string | null;
  biomedicalCode: string | null;
  biomedicalTitle: string | null;
  biomedicalDefinition: string | null;
  tm2Code: string | null;
  tm2Title: string | null;
}

export type MappingRelationship =
  | "exact"
  | "equivalent"
  | "broader"
  | "narrower"
  | "related"
  | "uncertain"
  | "unmapped";

export interface WHOConceptRef {
  code: string;
  title: string;
  uri: string;
  linearization: "TM2" | "Biomedicine";
  chapter?: string;
  source: "who-api-live" | "who-snapshot-cache" | "manual-entry";
}

export interface MappingConfidence {
  score: number; // 0-100
  band: "High" | "Medium" | "Low";
  label: "Swasthya-Setu Mapping Confidence";
  rationale: string;
}

export interface TerminologyMapping {
  namaste: NamasteConcept;
  tm2: WHOConceptRef | null;
  biomedicine: WHOConceptRef | null;
  tm2Relationship: MappingRelationship;
  biomedicineRelationship: MappingRelationship;
  confidence: MappingConfidence;
  source: string;
  lastVerified: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  phone: string;
  lastVisit: string;
  consent: { dataSharing: boolean; recordedOn: string };
}

export interface ConditionRecord {
  id: string;
  patientId: string;
  namasteCode: string;
  recordedDate: string;
  recordedBy: string;
  clinicalStatus: string;
  verificationStatus: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  status: "success" | "error" | "denied";
  detail: string;
}

export interface TerminologyMeta {
  namasteVersion: string;
  namasteRecordCount: number;
  whoIcdVersion: string;
  lastSyncAt: string;
  lastSyncConceptCount: number;
  conceptMapVersion: string;
  lastSyncStatus: "success" | "error" | "partial";
  lastSyncMode: "live" | "snapshot-fallback";
}

/**
 * A manually authored mapping created by the Terminology Manager, linking
 * an AYUSH/NAMASTE code directly to a WHO TM2 and/or WHO ICD-11
 * Biomedicine code with an explicit relationship, confidence, and
 * provenance — as opposed to the automatically resolved mappings derived
 * from the NAMASTE CSV + WHO API/snapshot lookup.
 */
export interface ManualMapping {
  id: string;
  ayushCode: string;
  ayushTerm: string;
  tm2Code: string | null;
  tm2Term: string | null;
  icdCode: string | null;
  icdTerm: string | null;
  relationship: MappingRelationship;
  confidence: number; // 0-100, manager-entered
  source: string; // "Official Mapping" | "Admin Added" | "Imported Dataset" | "AI Suggested" | free text
  version: string;
  createdAt: string;
  createdBy: string;
}

export interface DbShape {
  users: AppUser[];
  patients: Patient[];
  conditions: ConditionRecord[];
  auditLog: AuditEntry[];
  terminologyMeta: TerminologyMeta;
  manualMappings: ManualMapping[];
}
