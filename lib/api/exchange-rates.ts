import api from "@/lib/axios";
import { Currency } from "./accounts";

export interface ExchangeRate {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export async function getExchangeRates(): Promise<ExchangeRate[]> {
  const { data } = await api.get<ExchangeRate[]>("/exchange-rates");
  return data;
}

export async function createExchangeRate(payload: {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
}): Promise<ExchangeRate> {
  const { data } = await api.post<ExchangeRate>("/exchange-rates", payload);
  return data;
}

export async function updateExchangeRate(id: string, rate: number): Promise<ExchangeRate> {
  const { data } = await api.put<ExchangeRate>(`/exchange-rates/${id}`, { rate });
  return data;
}

export async function deleteExchangeRate(id: string): Promise<void> {
  await api.delete(`/exchange-rates/${id}`);
}
