import { NextRequest, NextResponse } from "next/server";
import { appendAudit } from "@/lib/db";

// ---------------------------------------------------------------------------
// POST /api/fhir/bundle
//
// Demonstrates the "EMR plugin" concept from section 13/14 of the brief:
// a Hospital EMR posts a FHIR Bundle (produced by Swasthya-Setu) to this
// endpoint and receives back a standard FHIR "transaction-response" style
// Bundle. No real external hospital system is contacted — this route
// simulates the downstream EMR accepting the dual-coded resources.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || body.resourceType !== "Bundle") {
    return NextResponse.json({ error: "Request body must be a FHIR Bundle resource" }, { status: 400 });
  }

  const entries = Array.isArray(body.entry) ? body.entry : [];

  const responseEntries = entries.map((e: { resource?: { resourceType?: string; id?: string } }) => ({
    response: {
      status: "201 Created",
      location: `${e.resource?.resourceType ?? "Resource"}/${e.resource?.id ?? "unknown"}`,
    },
  }));

  await appendAudit({
    user: "System",
    action: "EMR_BUNDLE_INGEST",
    resource: `Bundle (${entries.length} entries)`,
    status: "success",
    detail: `Simulated downstream EMR accepted bundle with ${entries.length} resources`,
  });

  return NextResponse.json({
    resourceType: "Bundle",
    type: "transaction-response",
    entry: responseEntries,
    meta: {
      note: "Simulated acceptance by demonstration EMR (Wellness Hospital). No real external hospital system was contacted.",
    },
  });
}
