import { NextResponse } from "next/server";
import { getAllNamasteConcepts } from "@/lib/namaste-loader";
import { resolveMapping } from "@/lib/mapping-resolver";
import { buildConceptMap } from "@/lib/fhir";

export async function GET() {
  const concepts = await getAllNamasteConcepts();
  const mappings = await Promise.all(concepts.map((c) => resolveMapping(c)));
  return NextResponse.json(buildConceptMap(mappings));
}
