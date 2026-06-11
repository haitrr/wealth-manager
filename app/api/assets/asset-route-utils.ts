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
  purchaseDate?: string | null;
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
  let purchaseDate: Date | null = null;
  if (payload.purchaseDate) {
    purchaseDate = new Date(payload.purchaseDate + "T00:00:00.000Z");
    if (isNaN(purchaseDate.getTime())) throw new Error("Invalid purchase date");
  }
  return {
    name,
    type: payload.type as AssetType,
    currency,
    currentValue,
    quantity: payload.quantity != null ? Number(payload.quantity) : null,
    ticker: payload.ticker?.trim() || null,
    purchaseDate,
    metadata: (payload.metadata ?? {}) as Prisma.InputJsonValue,
  };
}

export async function getOwnedAsset(id: string, userId: string) {
  return prisma.asset.findFirst({ where: { id, userId } });
}
