import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { parseAssetPayload, getOrCreateAssetCategory, AssetPayload } from "./asset-route-utils";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assets = await prisma.asset.findMany({
    where: { userId: session.userId },
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = parseAssetPayload(await req.json() as AssetPayload);

    const purchaseCategory = await getOrCreateAssetCategory(session.userId, "Asset Purchase", "expense");

    const asset = await prisma.$transaction(async tx => {
      const purchaseTx = await tx.transaction.create({
        data: {
          amount: parsed.purchasePrice,
          date: parsed.purchaseDate,
          description: `Purchase: ${parsed.name}`,
          accountId: parsed.purchaseAccountId,
          categoryId: purchaseCategory.id,
          userId: session.userId,
        },
      });

      let sellTransactionId: string | undefined;
      if (parsed.sellDate && parsed.sellPrice != null && parsed.sellAccountId) {
        const sellCategory = await getOrCreateAssetCategory(session.userId, "Asset Sale", "income");
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

      return tx.asset.create({
        data: {
          name: parsed.name,
          type: parsed.type,
          currency: parsed.currency,
          currentValue: parsed.currentValue,
          quantity: parsed.quantity,
          ticker: parsed.ticker,
          purchaseDate: parsed.purchaseDate,
          purchasePrice: parsed.purchasePrice,
          purchaseTransactionId: purchaseTx.id,
          sellDate: parsed.sellDate,
          sellPrice: parsed.sellPrice,
          sellTransactionId: sellTransactionId ?? null,
          metadata: parsed.metadata,
          userId: session.userId,
        },
      });
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create asset";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
