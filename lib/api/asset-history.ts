import api from "@/lib/axios";

export interface AssetHistoryEntry {
  id: string;
  assetId: string;
  date: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export async function getAssetHistory(assetId: string): Promise<AssetHistoryEntry[]> {
  const { data } = await api.get<AssetHistoryEntry[]>(`/assets/${assetId}/history`);
  return data;
}

export async function addAssetHistoryEntry(
  assetId: string,
  payload: { date: string; value: number }
): Promise<AssetHistoryEntry> {
  const { data } = await api.post<AssetHistoryEntry>(`/assets/${assetId}/history`, payload);
  return data;
}

export async function deleteAssetHistoryEntry(assetId: string, entryId: string): Promise<void> {
  await api.delete(`/assets/${assetId}/history/${entryId}`);
}
