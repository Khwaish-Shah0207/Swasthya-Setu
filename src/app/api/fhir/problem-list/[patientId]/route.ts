import { NextRequest, NextResponse } from "next/server";
import { findPatient, getConditionsForPatient } from "@/lib/db";
import { findNamasteByCode } from "@/lib/namaste-loader";
import { resolveMapping } from "@/lib/mapping-resolver";
import { buildConditionResource, buildProblemListBundle } from "@/lib/fhir";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await ctx.params;
  const patient = await findPatient(patientId);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found", patientId }, { status: 404 });
  }

  const conditions = await getConditionsForPatient(patientId);
  const resources = [];

  for (const condition of conditions) {
    const concept = await findNamasteByCode(condition.namasteCode);
    if (!concept) continue;
    const mapping = await resolveMapping(concept);
    resources.push(buildConditionResource(condition, patient, concept, mapping));
  }

  return NextResponse.json(buildProblemListBundle(patient, resources));
}
