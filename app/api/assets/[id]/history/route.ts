import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { getOwnedAsset } from "../../asset-route-utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = await getOwnedAsset(id, session.userId);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  const entries = await prisma.assetValueHistory.findMany({
    where: { assetId: id },
    orderBy: { date: "desc" },
    select: { id: true, assetId: true, date: true, value: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(
    entries.map(e => ({ ...e, date: e.date.toISOString().slice(0, 10) }))
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = await getOwnedAsset(id, session.userId);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  try {
    const body = await req.json();
    const date = new Date(body.date + "T00:00:00.000Z");
    if (isNaN(date.getTime())) throw new Error("Invalid date");
    const value = Number(body.value);
    if (!Number.isFinite(value) || value < 0) throw new Error("Value must be a non-negative number");

    const entry = await prisma.assetValueHistory.upsert({
      where: { assetId_date: { assetId: id, date } },
      create: { assetId: id, date, value },
      update: { value },
    });

    // Sync currentValue if this entry is now the most recent
    const latest = await prisma.assetValueHistory.findFirst({
      where: { assetId: id },
      orderBy: { date: "desc" },
    });
    if (latest && latest.id === entry.id) {
      await prisma.asset.update({ where: { id }, data: { currentValue: value } });
    }

    return NextResponse.json({ ...entry, date: entry.date.toISOString().slice(0, 10) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add history entry";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
