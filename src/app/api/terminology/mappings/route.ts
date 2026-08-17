import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addManualMapping, appendAudit, getManualMappings } from "@/lib/db";

export async function GET() {
  const mappings = (await getManualMappings())
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json({ mappings });
}

const schema = z.object({
  ayushCode: z.string().min(1),
  ayushTerm: z.string().min(1),
  tm2Code: z.string().optional().nullable(),
  tm2Term: z.string().optional().nullable(),
  icdCode: z.string().optional().nullable(),
  icdTerm: z.string().optional().nullable(),
  relationship: z.enum(["exact", "equivalent", "broader", "narrower", "related", "uncertain"]),
  confidence: z.number().min(0).max(100),
  source: z.string().min(1),
  version: z.string().min(1),
  createdBy: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid mapping payload", issues: parsed.error.issues }, { status: 400 });
  }

  const { tm2Code, tm2Term, icdCode, icdTerm } = parsed.data;
  if (!tm2Code && !icdCode) {
    return NextResponse.json(
      { error: "Provide at least a WHO TM2 code or a WHO ICD-11 Biomedicine code" },
      { status: 400 }
    );
  }

  const mapping = await addManualMapping({
    ayushCode: parsed.data.ayushCode,
    ayushTerm: parsed.data.ayushTerm,
    tm2Code: tm2Code || null,
    tm2Term: tm2Term || null,
    icdCode: icdCode || null,
    icdTerm: icdTerm || null,
    relationship: parsed.data.relationship,
    confidence: parsed.data.confidence,
    source: parsed.data.source,
    version: parsed.data.version,
    createdBy: parsed.data.createdBy,
  });

  await appendAudit({
    user: parsed.data.createdBy,
    action: "ADD_MAPPING",
    resource: `${parsed.data.ayushCode} → ${tm2Code ?? "—"} / ${icdCode ?? "—"}`,
    status: "success",
    detail: `Added manual mapping for ${parsed.data.ayushTerm} (${parsed.data.ayushCode}), confidence ${parsed.data.confidence}%, source: ${parsed.data.source}`,
  });

  return NextResponse.json({ mapping }, { status: 201 });
}
