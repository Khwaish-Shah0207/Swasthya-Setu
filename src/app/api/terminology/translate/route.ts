import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findNamasteByCode } from "@/lib/namaste-loader";
import { resolveMapping } from "@/lib/mapping-resolver";

const bodySchema = z.object({
  code: z.string().min(1),
  system: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }

  const concept = await findNamasteByCode(parsed.data.code);
  if (!concept) {
    return NextResponse.json(
      {
        resourceType: "Parameters",
        parameter: [{ name: "result", valueBoolean: false }, { name: "message", valueString: "Source code not found in NAMASTE CodeSystem" }],
      },
      { status: 404 }
    );
  }

  const mapping = await resolveMapping(concept);

  const matches = [];
  if (mapping.tm2) {
    matches.push({
      name: "match",
      part: [
        { name: "equivalence", valueCode: mapping.tm2Relationship },
        {
          name: "concept",
          valueCoding: { system: "http://id.who.int/icd/release/11/mms/tm2", code: mapping.tm2.code, display: mapping.tm2.title },
        },
      ],
    });
  }
  if (mapping.biomedicine) {
    matches.push({
      name: "match",
      part: [
        { name: "equivalence", valueCode: mapping.biomedicineRelationship },
        {
          name: "concept",
          valueCoding: { system: "http://id.who.int/icd/release/11/mms", code: mapping.biomedicine.code, display: mapping.biomedicine.title },
        },
      ],
    });
  }

  return NextResponse.json({
    resourceType: "Parameters",
    parameter: [
      { name: "result", valueBoolean: matches.length > 0 },
      ...matches,
      { name: "swasthyaSetuMappingConfidence", valueDecimal: mapping.confidence.score / 100 },
    ],
  });
}
