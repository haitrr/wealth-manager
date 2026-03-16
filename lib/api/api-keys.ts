import api from "@/lib/axios";

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CreatedApiKey extends ApiKey {
  key: string;
}

export async function getApiKeys(): Promise<ApiKey[]> {
  const { data } = await api.get<ApiKey[]>("/api-keys");
  return data;
}

export async function createApiKey(name: string): Promise<CreatedApiKey> {
  const { data } = await api.post<CreatedApiKey>("/api-keys", { name });
  return data;
}

export async function deleteApiKey(id: string): Promise<void> {
  await api.delete(`/api-keys/${id}`);
}
