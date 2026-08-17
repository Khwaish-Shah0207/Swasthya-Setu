import { NextRequest, NextResponse } from "next/server";
import { findPatient, getConditionsForPatient } from "@/lib/db";
import { findNamasteByCode } from "@/lib/namaste-loader";
import { resolveMapping } from "@/lib/mapping-resolver";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patient = await findPatient(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found", id }, { status: 404 });
  }

  const conditionRecords = await getConditionsForPatient(id);
  const problemList = [];

  for (const record of conditionRecords) {
    const concept = await findNamasteByCode(record.namasteCode);
    if (!concept) continue;
    const mapping = await resolveMapping(concept);
    problemList.push({ record, concept, mapping });
  }

  return NextResponse.json({ patient, problemList });
}
