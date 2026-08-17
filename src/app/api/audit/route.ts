import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendAudit, getAuditLog } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ entries: await getAuditLog() });
}

const schema = z.object({
  user: z.string().min(1),
  action: z.string().min(1),
  resource: z.string().min(1),
  status: z.enum(["success", "error", "denied"]),
  detail: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid audit entry" }, { status: 400 });
  }
  const entry = await appendAudit(parsed.data);
  return NextResponse.json(entry, { status: 201 });
}
