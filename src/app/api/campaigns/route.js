import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyAuth, requireAdmin } from "@/lib/authMiddleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  const { error } = verifyAuth(request);
  if (error) return error;

  const db = getDb();
  const campaigns = db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC").all();
  const res = NextResponse.json(campaigns);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

export async function POST(request) {
  const { error } = requireAdmin(request);
  if (error) return error;

  try {
    const { name, brand, channel, budget, expected_conversions } = await request.json();

    if (!name || !brand || !channel || !budget || !expected_conversions) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const db = getDb();
    const result = db
      .prepare(
        `
      INSERT INTO campaigns (name, brand, channel, budget, expected_conversions)
      VALUES (?, ?, ?, ?, ?)
    `,
      )
      .run(name, brand, channel, budget, expected_conversions);

    const campaign = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
