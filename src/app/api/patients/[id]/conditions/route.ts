import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addCondition, appendAudit, findPatient, getConditionsForPatient } from "@/lib/db";
import { findNamasteByCode } from "@/lib/namaste-loader";
import { resolveMapping } from "@/lib/mapping-resolver";
import { buildConditionResource } from "@/lib/fhir";

const schema = z.object({
  namasteCode: z.string().min(1),
  recordedBy: z.string().min(1),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patient = await findPatient(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found", id }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }

  const concept = await findNamasteByCode(parsed.data.namasteCode);
  if (!concept) {
    return NextResponse.json({ error: "Unknown NAMASTE code", code: parsed.data.namasteCode }, { status: 404 });
  }

  const existing = await getConditionsForPatient(id);
  const duplicate = existing.find((c) => c.namasteCode === concept.namasteCode);
  if (duplicate) {
    await appendAudit({
      user: parsed.data.recordedBy,
      action: "ADD_TO_PROBLEM_LIST",
      resource: `${id} / ${concept.namasteCode}`,
      status: "denied",
      detail: `Duplicate diagnosis rejected — ${concept.englishName} already exists on ${patient.name}'s problem list`,
    });
    return NextResponse.json(
      { error: "This diagnosis is already on the patient's problem list", conditionId: duplicate.id },
      { status: 409 }
    );
  }

  const newId = `COND-${1000 + existing.length + 1 + Math.floor(Math.random() * 100)}`;
  const record = await addCondition({
    id: newId,
    patientId: id,
    namasteCode: concept.namasteCode,
    recordedDate: new Date().toISOString().slice(0, 10),
    recordedBy: parsed.data.recordedBy,
    clinicalStatus: "active",
    verificationStatus: "confirmed",
  });

  const mapping = await resolveMapping(concept);
  const fhirCondition = buildConditionResource(record, patient, concept, mapping);

  await appendAudit({
    user: parsed.data.recordedBy,
    action: "ADD_TO_PROBLEM_LIST",
    resource: `${id} / ${concept.namasteCode}`,
    status: "success",
    detail: `Added ${concept.englishName} (${concept.namasteCode}) to ${patient.name}'s problem list`,
  });

  return NextResponse.json({ record, concept, mapping, fhirCondition }, { status: 201 });
}
