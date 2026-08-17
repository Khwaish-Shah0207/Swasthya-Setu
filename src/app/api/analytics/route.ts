import { NextResponse } from "next/server";
import { getAllConditions } from "@/lib/db";
import { findNamasteByCode, getAllNamasteConcepts } from "@/lib/namaste-loader";
import { resolveMapping } from "@/lib/mapping-resolver";

export async function GET() {
  const concepts = await getAllNamasteConcepts();
  const conditions = await getAllConditions();

  const mappings = await Promise.all(concepts.map((c) => resolveMapping(c)));

  const totalConcepts = concepts.length;
  const dualCoded = mappings.filter((m) => m.tm2 && m.biomedicine).length;
  const biomedicineOnly = mappings.filter((m) => m.biomedicine && !m.tm2).length;
  const tm2Only = mappings.filter((m) => m.tm2 && !m.biomedicine).length;
  const unmapped = mappings.filter((m) => !m.tm2 && !m.biomedicine).length;

  const confidenceDistribution = {
    High: mappings.filter((m) => m.confidence.band === "High").length,
    Medium: mappings.filter((m) => m.confidence.band === "Medium").length,
    Low: mappings.filter((m) => m.confidence.band === "Low").length,
  };

  const systemDistribution: Record<string, number> = {};
  for (const c of concepts) {
    systemDistribution[c.system] = (systemDistribution[c.system] ?? 0) + 1;
  }

  // Aggregate, anonymized encounter trend (demo data — no patient identifiers)
  const monthlyTrend = [
    { month: "Mar 2026", encounters: 41 },
    { month: "Apr 2026", encounters: 58 },
    { month: "May 2026", encounters: 66 },
    { month: "Jun 2026", encounters: 73 },
    { month: "Jul 2026", encounters: 89 },
    { month: "Aug 2026", encounters: 34 },
  ];

  const codedDiagnosesOnRecord = conditions.length;
  const dualCodedOnRecord = (
    await Promise.all(
      conditions.map(async (c) => {
        const concept = await findNamasteByCode(c.namasteCode);
        if (!concept) return false;
        const m = await resolveMapping(concept);
        return Boolean(m.tm2 && m.biomedicine);
      })
    )
  ).filter(Boolean).length;

  return NextResponse.json({
    disclaimer: "Prototype/demo data — anonymized and aggregated. No patient-identifiable information is shown.",
    totals: {
      namasteConcepts: totalConcepts,
      codedEncounters: codedDiagnosesOnRecord,
      dualCodedEncounters: dualCodedOnRecord,
      dualCodedConceptsAvailable: dualCoded,
      biomedicineOnlyConcepts: biomedicineOnly,
      tm2OnlyConcepts: tm2Only,
      unmappedConcepts: unmapped,
    },
    confidenceDistribution,
    systemDistribution,
    monthlyTrend,
  });
}
