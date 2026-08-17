import { NextResponse } from "next/server";
import { checkWhoConnection } from "@/lib/who-api";
import { getAllNamasteConcepts, ingestNamasteCsv } from "@/lib/namaste-loader";
import { getTerminologyMeta } from "@/lib/db";

export async function GET() {
  const who = await checkWhoConnection();
  const concepts = await getAllNamasteConcepts();
  const { issues } = ingestNamasteCsv();
  const meta = await getTerminologyMeta();

  return NextResponse.json({
    who: {
      label: "WHO ICD-11 API",
      connected: who.connected,
      mode: who.mode,
      reason: who.reason ?? null,
    },
    namaste: {
      label: "NAMASTE Dataset",
      loaded: concepts.length > 0,
      recordCount: concepts.length,
      ingestionIssueCount: issues.length,
    },
    fhir: {
      label: "FHIR R4",
      active: true,
      version: "R4",
    },
    terminologyService: {
      label: "Terminology Service",
      operational: true,
      operations: ["$lookup", "$translate", "ValueSet/$expand", "CodeSystem/$lookup"],
    },
    terminologyMeta: meta,
  });
}
