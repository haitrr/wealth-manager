import api from "@/lib/axios";

export interface UserSettings {
  id: string;
  userId: string;
  loanBorrowedPrincipalCategoryId: string | null;
  loanBorrowedInterestCategoryId: string | null;
  loanBorrowedPrepayFeeCategoryId: string | null;
  loanLentPrincipalCategoryId: string | null;
  loanLentInterestCategoryId: string | null;
  loanLentPrepayFeeCategoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserSettingsPayload = Partial<Pick<
  UserSettings,
  | "loanBorrowedPrincipalCategoryId"
  | "loanBorrowedInterestCategoryId"
  | "loanBorrowedPrepayFeeCategoryId"
  | "loanLentPrincipalCategoryId"
  | "loanLentInterestCategoryId"
  | "loanLentPrepayFeeCategoryId"
>>;

export async function getSettings(): Promise<UserSettings> {
  const { data } = await api.get<UserSettings>("/settings");
  return data;
}

export async function updateSettings(payload: UserSettingsPayload): Promise<UserSettings> {
  const { data } = await api.put<UserSettings>("/settings", payload);
  return data;
}
