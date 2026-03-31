import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/authMiddleware";

export const runtime = "nodejs";

export async function PUT(request, { params }) {
  const { error } = requireAdmin(request);
  if (error) return error;

  try {
    const { id } = await params;
    const campaignId = Number(id);
    const { name, brand, channel, budget, expected_conversions } = await request.json();
    const db = getDb();

    const existing = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(campaignId);
    if (!existing) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    db.prepare(
      `
      UPDATE campaigns SET name=?, brand=?, channel=?, budget=?, expected_conversions=?
      WHERE id=?
    `,
    ).run(name, brand, channel, budget, expected_conversions, campaignId);

    const updated = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(campaignId);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = requireAdmin(request);
  if (error) return error;

  const db = getDb();
  const { id } = await params;
  const campaignId = Number(id);

  const existing = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(campaignId);
  if (!existing) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  db.prepare("DELETE FROM campaigns WHERE id = ?").run(campaignId);
  return NextResponse.json({ message: "Campaign deleted successfully" });
}
