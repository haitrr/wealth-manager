import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { getOwnedAsset, getOrCreateAssetCategory, parseAssetPayload, AssetPayload } from "../asset-route-utils";

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
  const existing = await prisma.asset.findFirst({
    where: { id, userId: session.userId },
    select: { purchaseTransactionId: true, sellTransactionId: true, name: true },
  });
  if (!existing) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  try {
    const parsed = parseAssetPayload(await req.json() as AssetPayload);

    const updated = await prisma.$transaction(async tx => {
      // Update the existing purchase transaction
      await tx.transaction.update({
        where: { id: existing.purchaseTransactionId! },
        data: {
          amount: parsed.purchasePrice,
          date: parsed.purchaseDate,
          description: `Purchase: ${parsed.name}`,
          accountId: parsed.purchaseAccountId,
        },
      });

      let sellTransactionId: string | null = existing.sellTransactionId;

      if (parsed.sellDate && parsed.sellPrice != null && parsed.sellAccountId) {
        const sellCategory = await getOrCreateAssetCategory(session.userId, "Asset Sale", "income");
        if (existing.sellTransactionId) {
          // Update existing sell transaction
          await tx.transaction.update({
            where: { id: existing.sellTransactionId },
            data: {
              amount: parsed.sellPrice,
              date: parsed.sellDate,
              description: `Sale: ${parsed.name}`,
              accountId: parsed.sellAccountId,
            },
          });
        } else {
          // Create new sell transaction
          const sellTx = await tx.transaction.create({
            data: {
              amount: parsed.sellPrice,
              date: parsed.sellDate,
              description: `Sale: ${parsed.name}`,
              accountId: parsed.sellAccountId,
              categoryId: sellCategory.id,
              userId: session.userId,
            },
          });
          sellTransactionId = sellTx.id;
        }
      } else if (existing.sellTransactionId) {
        // Sell was removed — unlink and delete the sell transaction
        await tx.asset.update({ where: { id }, data: { sellTransactionId: null } });
        await tx.transaction.delete({ where: { id: existing.sellTransactionId } });
        sellTransactionId = null;
      }

      return tx.asset.update({
        where: { id },
        data: {
          name: parsed.name,
          type: parsed.type,
          currency: parsed.currency,
          currentValue: parsed.currentValue,
          quantity: parsed.quantity,
          ticker: parsed.ticker,
          purchaseDate: parsed.purchaseDate,
          purchasePrice: parsed.purchasePrice,
          sellDate: parsed.sellDate,
          sellPrice: parsed.sellPrice,
          sellTransactionId,
          metadata: parsed.metadata,
        },
      });
    });

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
  const asset = await prisma.asset.findFirst({
    where: { id, userId: session.userId },
    select: { purchaseTransactionId: true, sellTransactionId: true },
  });
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  await prisma.$transaction(async tx => {
    // Delete asset first (removes the FK reference), then delete the linked transactions
    await tx.asset.delete({ where: { id } });
    if (asset.purchaseTransactionId) {
      await tx.transaction.delete({ where: { id: asset.purchaseTransactionId } });
    }
    if (asset.sellTransactionId) {
      await tx.transaction.delete({ where: { id: asset.sellTransactionId } });
    }
  });

  return NextResponse.json({ success: true });
}
