import { NextResponse } from "next/server";
import { getAllNamasteConcepts } from "@/lib/namaste-loader";
import { resolveMapping } from "@/lib/mapping-resolver";

export async function GET() {
  const concepts = await getAllNamasteConcepts();
  const rows = await Promise.all(
    concepts.map(async (concept) => ({ concept, mapping: await resolveMapping(concept) }))
  );
  return NextResponse.json({ count: rows.length, rows });
}
