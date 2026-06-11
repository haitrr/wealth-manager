import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { getOwnedAsset } from "../../../asset-route-utils";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, entryId } = await params;
  const asset = await getOwnedAsset(id, session.userId);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  const entry = await prisma.assetValueHistory.findFirst({
    where: { id: entryId, assetId: id },
  });
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  await prisma.assetValueHistory.delete({ where: { id: entryId } });

  // Sync currentValue to the new latest entry after deletion
  const latest = await prisma.assetValueHistory.findFirst({
    where: { assetId: id },
    orderBy: { date: "desc" },
  });
  if (latest) {
    await prisma.asset.update({ where: { id }, data: { currentValue: latest.value } });
  }

  return NextResponse.json({ success: true });
}
