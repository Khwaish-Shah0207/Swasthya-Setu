import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendAudit, deleteManualMapping, updateManualMapping } from "@/lib/db";
import type { ManualMapping } from "@/lib/types";

const patchSchema = z.object({
  ayushCode: z.string().min(1).optional(),
  ayushTerm: z.string().min(1).optional(),
  tm2Code: z.string().optional().nullable(),
  tm2Term: z.string().optional().nullable(),
  icdCode: z.string().optional().nullable(),
  icdTerm: z.string().optional().nullable(),
  relationship: z.enum(["exact", "equivalent", "broader", "narrower", "related", "uncertain"]).optional(),
  confidence: z.number().min(0).max(100).optional(),
  source: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  updatedBy: z.string().min(1),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid mapping payload", issues: parsed.error.issues }, { status: 400 });
  }

  const { updatedBy, ...patch } = parsed.data;
  const nullableKeys = new Set(["tm2Code", "tm2Term", "icdCode", "icdTerm"]);
  const cleanPatch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    cleanPatch[key] = value === "" && nullableKeys.has(key) ? null : value;
  }

  const updated = await updateManualMapping(
    id,
    cleanPatch as Partial<Omit<ManualMapping, "id" | "createdAt">>
  );
  if (!updated) {
    return NextResponse.json({ error: "Mapping not found", id }, { status: 404 });
  }

  await appendAudit({
    user: updatedBy,
    action: "EDIT_MAPPING",
    resource: `${updated.ayushCode} → ${updated.tm2Code ?? "—"} / ${updated.icdCode ?? "—"}`,
    status: "success",
    detail: `Updated mapping for ${updated.ayushTerm} (${updated.ayushCode})`,
  });

  return NextResponse.json({ mapping: updated });
}

const deleteSchema = z.object({ deletedBy: z.string().min(1) });

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const json = await req.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(json);
  const deletedBy = parsed.success ? parsed.data.deletedBy : "Terminology Manager";

  const ok = await deleteManualMapping(id);
  if (!ok) {
    return NextResponse.json({ error: "Mapping not found", id }, { status: 404 });
  }

  await appendAudit({
    user: deletedBy,
    action: "DELETE_MAPPING",
    resource: id,
    status: "success",
    detail: `Deleted manual mapping ${id}`,
  });

  return NextResponse.json({ deleted: true, id });
}
