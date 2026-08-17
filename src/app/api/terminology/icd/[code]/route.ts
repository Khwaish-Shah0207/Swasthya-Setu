import { NextRequest, NextResponse } from "next/server";
import { lookupWhoConcept } from "@/lib/who-api";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const concept = await lookupWhoConcept(code);

  if (!concept) {
    return NextResponse.json(
      { error: "WHO ICD-11 concept not found in live API or local snapshot", code },
      { status: 404 }
    );
  }

  return NextResponse.json(concept);
}
