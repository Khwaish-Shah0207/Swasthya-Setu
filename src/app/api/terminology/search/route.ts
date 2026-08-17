import { NextRequest, NextResponse } from "next/server";
import { searchNamaste } from "@/lib/namaste-loader";
import { suggestTerminology } from "@/lib/semantic-search";
import { resolveMapping } from "@/lib/mapping-resolver";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ query: q, results: [], assisted: false }, { status: 200 });
  }

  let matches = await searchNamaste(q);
  let assisted = false;

  if (matches.length === 0) {
    const suggestions = await suggestTerminology(q);
    matches = suggestions.map((s) => s.concept);
    assisted = suggestions.length > 0;
  }

  const results = await Promise.all(matches.slice(0, 10).map((c) => resolveMapping(c)));

  return NextResponse.json({
    query: q,
    assisted,
    assistedNotice: assisted ? "Terminology suggestion — not a medical diagnosis." : null,
    count: results.length,
    results,
  });
}
