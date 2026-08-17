import { NextRequest, NextResponse } from "next/server";
import { findPatient, getConditionsForPatient } from "@/lib/db";
import { findNamasteByCode } from "@/lib/namaste-loader";
import { resolveMapping } from "@/lib/mapping-resolver";
import { buildConditionResource } from "@/lib/fhir";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ patientId: string; conditionId: string }> }
) {
  const { patientId, conditionId } = await ctx.params;
  const patient = await findPatient(patientId);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found", patientId }, { status: 404 });
  }

  const record = (await getConditionsForPatient(patientId)).find((c) => c.id === conditionId);
  if (!record) {
    return NextResponse.json({ error: "Condition not found", conditionId }, { status: 404 });
  }

  const concept = await findNamasteByCode(record.namasteCode);
  if (!concept) {
    return NextResponse.json({ error: "Underlying NAMASTE concept not found" }, { status: 404 });
  }

  const mapping = await resolveMapping(concept);
  const resource = buildConditionResource(record, patient, concept, mapping);

  return NextResponse.json({ record, concept, mapping, resource });
}
