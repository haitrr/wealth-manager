import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";
import { getOwnedAsset } from "../../asset-route-utils";

async function fetchStockPrice(ticker: string): Promise<number> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status} for ticker ${ticker}`);
  const json = await res.json();
  const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (!price) throw new Error(`Could not parse price for ticker ${ticker}`);
  return price;
}

async function fetchGoldPriceUsd(): Promise<number> {
  const res = await fetch("https://open.er-api.com/v6/latest/XAU", { cache: "no-store" });
  if (!res.ok) throw new Error(`Gold price fetch returned ${res.status}`);
  const json = await res.json();
  const usdPerOz = json?.rates?.USD;
  if (!usdPerOz) throw new Error("Could not parse gold price");
  return usdPerOz;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = await getOwnedAsset(id, session.userId);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  if (asset.type !== "stock" && asset.type !== "gold") {
    return NextResponse.json({ error: "Price refresh is only supported for stocks and gold" }, { status: 400 });
  }

  try {
    let pricePerUnit: number;
    if (asset.type === "stock") {
      if (!asset.ticker) return NextResponse.json({ error: "Asset has no ticker" }, { status: 400 });
      pricePerUnit = await fetchStockPrice(asset.ticker);
    } else {
      pricePerUnit = await fetchGoldPriceUsd();
    }

    const quantity = asset.quantity ?? 1;
    const currentValue = pricePerUnit * quantity;

    const updated = await prisma.asset.update({
      where: { id },
      data: { currentValue, lastPricedAt: new Date() },
    });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Price fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
