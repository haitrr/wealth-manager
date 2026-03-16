import api from "@/lib/axios";

export type Currency = "USD" | "VND";

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: Currency;
  isDefault: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export async function getAccounts(): Promise<Account[]> {
  const { data } = await api.get<Account[]>("/accounts");
  return data;
}

export async function createAccount(payload: {
  name: string;
  currency?: Currency;
}): Promise<Account> {
  const { data } = await api.post<Account>("/accounts", payload);
  return data;
}

export async function updateAccount(
  id: string,
  payload: {
    name: string;
    currency?: Currency;
  }
): Promise<Account> {
  const { data } = await api.put<Account>(`/accounts/${id}`, payload);
  return data;
}

export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/accounts/${id}`);
}

export async function setDefaultAccount(id: string): Promise<void> {
  await api.post(`/accounts/${id}/set-default`);
}
