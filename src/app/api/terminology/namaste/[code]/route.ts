import { NextRequest, NextResponse } from "next/server";
import { findNamasteByCode } from "@/lib/namaste-loader";
import { resolveMapping } from "@/lib/mapping-resolver";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const concept = await findNamasteByCode(code);

  if (!concept) {
    return NextResponse.json({ error: "NAMASTE concept not found", code }, { status: 404 });
  }

  const mapping = await resolveMapping(concept);
  return NextResponse.json(mapping);
}
