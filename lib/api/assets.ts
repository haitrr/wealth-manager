import api from "@/lib/axios";
import { Currency } from "./accounts";

export type AssetType = "real_estate" | "stock" | "bond" | "gold";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  currency: Currency;
  currentValue: number;
  quantity: number | null;
  ticker: string | null;
  metadata: Record<string, unknown>;
  lastPricedAt: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetPayload {
  name: string;
  type: AssetType;
  currency?: Currency;
  currentValue: number;
  quantity?: number | null;
  ticker?: string | null;
  metadata?: Record<string, unknown>;
}

export async function getAssets(): Promise<Asset[]> {
  const { data } = await api.get<Asset[]>("/assets");
  return data;
}

export async function getAsset(id: string): Promise<Asset> {
  const { data } = await api.get<Asset>(`/assets/${id}`);
  return data;
}

export async function createAsset(payload: AssetPayload): Promise<Asset> {
  const { data } = await api.post<Asset>("/assets", payload);
  return data;
}

export async function updateAsset(id: string, payload: AssetPayload): Promise<Asset> {
  const { data } = await api.patch<Asset>(`/assets/${id}`, payload);
  return data;
}

export async function deleteAsset(id: string): Promise<void> {
  await api.delete(`/assets/${id}`);
}

export async function refreshAssetPrice(id: string): Promise<Asset> {
  const { data } = await api.post<Asset>(`/assets/${id}/refresh-price`);
  return data;
}
