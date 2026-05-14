import api from "@/lib/axios";
import { Currency } from "./accounts";
import { AssetType } from "./assets";

export interface AccountItem {
  id: string;
  name: string;
  balance: number;
  currency: Currency;
  valueInUsd: number;
}

export interface AssetItem {
  id: string;
  name: string;
  type: AssetType;
  currency: Currency;
  currentValue: number;
  quantity: number | null;
  ticker: string | null;
  lastPricedAt: string | null;
  valueInUsd: number;
}

export interface LoanItem {
  id: string;
  name: string;
  direction: "borrowed" | "lent";
  outstandingPrincipal: number;
  currency: Currency;
  valueInUsd: number;
}

export interface AssetsByType {
  real_estate: { total: number; items: AssetItem[] };
  stock: { total: number; items: AssetItem[] };
  bond: { total: number; items: AssetItem[] };
  gold: { total: number; items: AssetItem[] };
}

export interface NetWorthResponse {
  totalNetWorth: number;
  missingRates: string[];
  liquid: { total: number; accounts: AccountItem[] };
  assets: { total: number; byType: AssetsByType };
  liabilities: { total: number; loans: LoanItem[] };
}

export async function getNetWorth(): Promise<NetWorthResponse> {
  const { data } = await api.get<NetWorthResponse>("/networth");
  return data;
}
