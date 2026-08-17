import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findUserByUsername, appendAudit } from "@/lib/db";

const schema = z.object({ username: z.string().min(1) });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  const user = await findUserByUsername(parsed.data.username);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized: unknown demo user" }, { status: 401 });
  }

  await appendAudit({
    user: user.name,
    action: "LOGIN",
    resource: "Session",
    status: "success",
    detail: `Signed in as ${user.role === "clinician" ? "AYUSH Doctor" : "Terminology Manager"}`,
  });

  return NextResponse.json({ user });
}
