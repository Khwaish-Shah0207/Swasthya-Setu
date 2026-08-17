import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { suggestTerminology } from "@/lib/semantic-search";

const schema = z.object({ text: z.string().min(1) });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const suggestions = await suggestTerminology(parsed.data.text);

  return NextResponse.json({
    notice: "Terminology suggestion — not a medical diagnosis.",
    query: parsed.data.text,
    suggestions: suggestions.map((s) => ({
      namasteCode: s.concept.namasteCode,
      englishName: s.concept.englishName,
      sanskritTerm: s.concept.sanskritTerm,
      score: Math.round(s.score * 100),
      matchedVia: s.matchedVia,
    })),
  });
}
