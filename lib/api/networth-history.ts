import api from "@/lib/axios";

export interface HistoryPoint {
  date: string;
  total: number;
  liquid: number;
  assets: number;
  liabilities: number;
}

export type NetWorthRange = "all" | "1y" | "6m" | "3m" | "1m";

export async function getNetWorthHistory(range: NetWorthRange): Promise<HistoryPoint[]> {
  const { data } = await api.get<HistoryPoint[]>(`/networth/history?range=${range}`);
  return data;
}
