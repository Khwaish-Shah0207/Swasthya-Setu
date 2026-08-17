import { NextRequest, NextResponse } from "next/server";
import { getPatients } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const patients = await getPatients();
  const filtered = q
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q)
      )
    : patients;
  return NextResponse.json({ count: filtered.length, patients: filtered });
}
