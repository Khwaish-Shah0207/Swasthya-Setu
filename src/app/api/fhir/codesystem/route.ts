import { NextResponse } from "next/server";
import { getAllNamasteConcepts } from "@/lib/namaste-loader";
import { buildNamasteCodeSystem, buildSearchableValueSet } from "@/lib/fhir";

export async function GET() {
  const concepts = await getAllNamasteConcepts();
  return NextResponse.json({
    codeSystem: buildNamasteCodeSystem(concepts),
    valueSet: buildSearchableValueSet(concepts),
  });
}
