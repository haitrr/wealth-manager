import { AssetType, Currency, Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/db";

const ASSET_TYPES = new Set<AssetType>(["real_estate", "stock", "bond", "gold"]);
const CURRENCIES = new Set<Currency>(["USD", "VND"]);

export interface AssetPayload {
  name: string;
  type: string;
  currency?: string;
  currentValue: number;
  quantity?: number | null;
  ticker?: string | null;
  purchaseDate: string;
  purchasePrice: number;
  purchaseAccountId: string;
  sellDate?: string | null;
  sellPrice?: number | null;
  sellAccountId?: string | null;
  metadata?: Record<string, unknown>;
}

export function parseAssetPayload(payload: AssetPayload) {
  const name = payload.name?.trim();
  if (!name) throw new Error("Name is required");
  if (!ASSET_TYPES.has(payload.type as AssetType)) throw new Error("Invalid asset type");
  const currency = (payload.currency ?? "USD") as Currency;
  if (!CURRENCIES.has(currency)) throw new Error("Invalid currency");
  const currentValue = Number(payload.currentValue);
  if (!Number.isFinite(currentValue) || currentValue < 0) throw new Error("Current value must be a non-negative number");
  if (payload.type === "stock") {
    if (!payload.ticker?.trim()) throw new Error("Ticker is required for stocks");
    if (!payload.quantity || Number(payload.quantity) <= 0) throw new Error("Quantity must be positive for stocks");
  }
  if (payload.type === "gold") {
    if (!payload.quantity || Number(payload.quantity) <= 0) throw new Error("Quantity must be positive for gold");
  }

  if (!payload.purchaseDate) throw new Error("Purchase date is required");
  const purchaseDate = new Date(payload.purchaseDate + "T00:00:00.000Z");
  if (isNaN(purchaseDate.getTime())) throw new Error("Invalid purchase date");

  const purchasePrice = Number(payload.purchasePrice);
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) throw new Error("Purchase price is required and must be a non-negative number");

  if (!payload.purchaseAccountId?.trim()) throw new Error("Purchase account is required");

  let sellDate: Date | null = null;
  let sellPrice: number | null = null;
  const hasSell = !!(payload.sellDate || payload.sellPrice != null || payload.sellAccountId);
  if (hasSell) {
    if (!payload.sellDate) throw new Error("Sell date is required when selling");
    sellDate = new Date(payload.sellDate + "T00:00:00.000Z");
    if (isNaN(sellDate.getTime())) throw new Error("Invalid sell date");
    sellPrice = payload.sellPrice != null ? Number(payload.sellPrice) : null;
    if (sellPrice === null || !Number.isFinite(sellPrice) || sellPrice < 0) throw new Error("Sell price is required when selling");
    if (!payload.sellAccountId?.trim()) throw new Error("Sell account is required when selling");
  }

  return {
    name,
    type: payload.type as AssetType,
    currency,
    currentValue,
    quantity: payload.quantity != null ? Number(payload.quantity) : null,
    ticker: payload.ticker?.trim() || null,
    purchaseDate,
    purchasePrice,
    purchaseAccountId: payload.purchaseAccountId,
    sellDate,
    sellPrice,
    sellAccountId: hasSell ? payload.sellAccountId! : null,
    metadata: (payload.metadata ?? {}) as Prisma.InputJsonValue,
  };
}

export async function getOrCreateAssetCategory(userId: string, categoryName: string, type: "income" | "expense") {
  const existing = await prisma.transactionCategory.findFirst({
    where: { userId, name: categoryName },
  });
  if (existing) return existing;
  return prisma.transactionCategory.create({
    data: { userId, name: categoryName, type },
  });
}

export async function getOwnedAsset(id: string, userId: string) {
  return prisma.asset.findFirst({ where: { id, userId } });
}
