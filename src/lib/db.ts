import type {
  DbShape,
  AuditEntry,
  ConditionRecord,
  ManualMapping,
  Patient,
  AppUser,
  TerminologyMeta,
} from "./types";
import { supabase } from "./supabase";

// Supabase persistence layer. The rest of the application keeps its original
// camelCase TypeScript models while PostgreSQL uses snake_case columns.

export async function getUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  return (data ?? []) as AppUser[];
}

export async function findUserByUsername(username: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return data as AppUser | null;
}

function mapPatient(row: any): Patient {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    gender: row.gender,
    mrn: row.mrn,
    phone: row.phone,
    lastVisit: row.last_visit,
    consent: {
      dataSharing: row.consent_data_sharing,
      recordedOn: row.consent_recorded_on,
    },
  };
}

export async function getPatients(): Promise<Patient[]> {
  const { data, error } = await supabase.from("patients").select("*").order("id");
  if (error) throw error;
  return (data ?? []).map(mapPatient);
}

export async function findPatient(id: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPatient(data) : null;
}

function mapCondition(row: any): ConditionRecord {
  return {
    id: row.id,
    patientId: row.patient_id,
    namasteCode: row.namaste_code,
    recordedDate: row.recorded_date,
    recordedBy: row.recorded_by,
    clinicalStatus: row.clinical_status,
    verificationStatus: row.verification_status,
  };
}

export async function getConditionsForPatient(patientId: string): Promise<ConditionRecord[]> {
  const { data, error } = await supabase
    .from("conditions")
    .select("*")
    .eq("patient_id", patientId)
    .order("recorded_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapCondition);
}

export async function getAllConditions(): Promise<ConditionRecord[]> {
  const { data, error } = await supabase
    .from("conditions")
    .select("*")
    .order("recorded_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapCondition);
}

export async function addCondition(condition: ConditionRecord): Promise<ConditionRecord> {
  const { data, error } = await supabase
    .from("conditions")
    .insert({
      id: condition.id,
      patient_id: condition.patientId,
      namaste_code: condition.namasteCode,
      recorded_date: condition.recordedDate,
      recorded_by: condition.recordedBy,
      clinical_status: condition.clinicalStatus,
      verification_status: condition.verificationStatus,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapCondition(data);
}

function mapAuditEntry(row: any): AuditEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    user: row.user,
    action: row.action,
    resource: row.resource,
    status: row.status,
    detail: row.detail,
  };
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAuditEntry);
}

export async function appendAudit(
  entry: Omit<AuditEntry, "id" | "timestamp">
): Promise<AuditEntry> {
  const { data: latest, error: latestError } = await supabase
    .from("audit_log")
    .select("id")
    .order("timestamp", { ascending: false })
    .limit(1);
  if (latestError) throw latestError;

  let nextNumber = 1;
  if (latest?.[0]?.id) {
    const match = String(latest[0].id).match(/A-(\d+)/);
    if (match) nextNumber = Number(match[1]) + 1;
  }

  const id = `A-${String(nextNumber).padStart(4, "0")}`;
  const timestamp = new Date().toISOString();

  const { data, error } = await supabase
    .from("audit_log")
    .insert({ id, timestamp, ...entry })
    .select("*")
    .single();
  if (error) throw error;
  return mapAuditEntry(data);
}

function mapManualMapping(row: any): ManualMapping {
  return {
    id: row.id,
    ayushCode: row.ayush_code,
    ayushTerm: row.ayush_term,
    tm2Code: row.tm2_code,
    tm2Term: row.tm2_term,
    icdCode: row.icd_code,
    icdTerm: row.icd_term,
    relationship: row.relationship,
    confidence: row.confidence,
    source: row.source,
    version: row.version,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export async function getManualMappings(): Promise<ManualMapping[]> {
  const { data, error } = await supabase
    .from("manual_mappings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapManualMapping);
}

export async function findManualMappingByAyushCode(code: string): Promise<ManualMapping | null> {
  const { data, error } = await supabase
    .from("manual_mappings")
    .select("*")
    .ilike("ayush_code", code)
    .maybeSingle();
  if (error) throw error;
  return data ? mapManualMapping(data) : null;
}

export async function addManualMapping(
  mapping: Omit<ManualMapping, "id" | "createdAt">
): Promise<ManualMapping> {
  const { data: latest, error: latestError } = await supabase
    .from("manual_mappings")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1);
  if (latestError) throw latestError;

  let nextNumber = 1;
  if (latest?.[0]?.id) {
    const match = String(latest[0].id).match(/MAP-(\d+)/);
    if (match) nextNumber = Number(match[1]) + 1;
  }

  const id = `MAP-${String(nextNumber).padStart(4, "0")}`;
  const createdAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("manual_mappings")
    .insert({
      id,
      ayush_code: mapping.ayushCode,
      ayush_term: mapping.ayushTerm,
      tm2_code: mapping.tm2Code,
      tm2_term: mapping.tm2Term,
      icd_code: mapping.icdCode,
      icd_term: mapping.icdTerm,
      relationship: mapping.relationship,
      confidence: mapping.confidence,
      source: mapping.source,
      version: mapping.version,
      created_at: createdAt,
      created_by: mapping.createdBy,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapManualMapping(data);
}

export async function updateManualMapping(
  id: string,
  patch: Partial<Omit<ManualMapping, "id" | "createdAt">>
): Promise<ManualMapping | null> {
  const updateData: Record<string, unknown> = {};
  if (patch.ayushCode !== undefined) updateData.ayush_code = patch.ayushCode;
  if (patch.ayushTerm !== undefined) updateData.ayush_term = patch.ayushTerm;
  if (patch.tm2Code !== undefined) updateData.tm2_code = patch.tm2Code;
  if (patch.tm2Term !== undefined) updateData.tm2_term = patch.tm2Term;
  if (patch.icdCode !== undefined) updateData.icd_code = patch.icdCode;
  if (patch.icdTerm !== undefined) updateData.icd_term = patch.icdTerm;
  if (patch.relationship !== undefined) updateData.relationship = patch.relationship;
  if (patch.confidence !== undefined) updateData.confidence = patch.confidence;
  if (patch.source !== undefined) updateData.source = patch.source;
  if (patch.version !== undefined) updateData.version = patch.version;
  if (patch.createdBy !== undefined) updateData.created_by = patch.createdBy;

  const { data, error } = await supabase
    .from("manual_mappings")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? mapManualMapping(data) : null;
}

export async function deleteManualMapping(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("manual_mappings")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  return Boolean(data?.length);
}

function mapTerminologyMeta(row: any): TerminologyMeta {
  return {
    namasteVersion: row.namaste_version,
    namasteRecordCount: row.namaste_record_count,
    whoIcdVersion: row.who_icd_version,
    lastSyncAt: row.last_sync_at,
    lastSyncConceptCount: row.last_sync_concept_count,
    conceptMapVersion: row.concept_map_version,
    lastSyncStatus: row.last_sync_status,
    lastSyncMode: row.last_sync_mode,
  };
}

export async function getTerminologyMeta(): Promise<TerminologyMeta> {
  const { data, error } = await supabase
    .from("terminology_meta")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return mapTerminologyMeta(data);
}

export async function updateTerminologyMeta(
  patch: Partial<DbShape["terminologyMeta"]>
): Promise<TerminologyMeta> {
  const updateData: Record<string, unknown> = {};
  if (patch.namasteVersion !== undefined) updateData.namaste_version = patch.namasteVersion;
  if (patch.namasteRecordCount !== undefined) updateData.namaste_record_count = patch.namasteRecordCount;
  if (patch.whoIcdVersion !== undefined) updateData.who_icd_version = patch.whoIcdVersion;
  if (patch.lastSyncAt !== undefined) updateData.last_sync_at = patch.lastSyncAt;
  if (patch.lastSyncConceptCount !== undefined) updateData.last_sync_concept_count = patch.lastSyncConceptCount;
  if (patch.conceptMapVersion !== undefined) updateData.concept_map_version = patch.conceptMapVersion;
  if (patch.lastSyncStatus !== undefined) updateData.last_sync_status = patch.lastSyncStatus;
  if (patch.lastSyncMode !== undefined) updateData.last_sync_mode = patch.lastSyncMode;

  const { data, error } = await supabase
    .from("terminology_meta")
    .update(updateData)
    .eq("id", 1)
    .select("*")
    .single();
  if (error) throw error;
  return mapTerminologyMeta(data);
}
