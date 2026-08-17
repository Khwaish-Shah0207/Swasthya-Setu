import { NextResponse } from "next/server";
import { ingestNamasteCsv } from "@/lib/namaste-loader";

export async function GET() {
  const { concepts, issues } = ingestNamasteCsv();
  return NextResponse.json({ conceptCount: concepts.length, issues });
}
