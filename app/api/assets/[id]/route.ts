import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { getOwnedAsset, parseAssetPayload, AssetPayload } from "../asset-route-utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = await getOwnedAsset(id, session.userId);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  return NextResponse.json(asset);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedAsset(id, session.userId);
  if (!existing) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  try {
    const parsed = parseAssetPayload(await req.json() as AssetPayload);
    const updated = await prisma.asset.update({ where: { id }, data: parsed });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update asset";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = await getOwnedAsset(id, session.userId);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
