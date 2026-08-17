import { NextResponse } from "next/server";
import { checkWhoConnection, getSnapshotMeta } from "@/lib/who-api";
import { getAllNamasteConcepts } from "@/lib/namaste-loader";
import { updateTerminologyMeta, appendAudit, getTerminologyMeta } from "@/lib/db";

export async function POST() {
  const status = await checkWhoConnection();
  const snapshotMeta = getSnapshotMeta();
  const namasteConcepts = await getAllNamasteConcepts();

  const conceptCount = status.mode === "live" ? snapshotMeta.count : snapshotMeta.count;

  const meta = await updateTerminologyMeta({
    namasteRecordCount: namasteConcepts.length,
    lastSyncAt: new Date().toISOString(),
    lastSyncConceptCount: conceptCount,
    lastSyncStatus: status.connected ? "success" : "partial",
    lastSyncMode: status.mode,
  });

  await appendAudit({
    user: "System",
    action: "WHO_SYNC",
    resource: "WHO ICD-11 API",
    status: status.connected ? "success" : "error",
    detail: status.connected
      ? `Synchronised ${conceptCount} concepts from live WHO ICD-11 API`
      : `WHO API unavailable (${status.reason}) — continued using snapshot dated ${status.snapshotCapturedAt}`,
  });

  return NextResponse.json({
    who: status,
    terminologyMeta: meta,
  });
}

export async function GET() {
  return NextResponse.json({ terminologyMeta: await getTerminologyMeta() });
}
