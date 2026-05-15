import api from "@/lib/axios";
import { Currency } from "./accounts";

export interface UserSettings {
  id: string;
  userId: string;
  defaultCurrency: Currency;
  timezone: string;
  loanBorrowedInitialCategoryId: string | null;
  loanBorrowedPrincipalCategoryId: string | null;
  loanBorrowedInterestCategoryId: string | null;
  loanBorrowedPrepayFeeCategoryId: string | null;
  loanLentInitialCategoryId: string | null;
  loanLentPrincipalCategoryId: string | null;
  loanLentInterestCategoryId: string | null;
  loanLentPrepayFeeCategoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserSettingsPayload = Partial<Pick<
  UserSettings,
  | "defaultCurrency"
  | "timezone"
  | "loanBorrowedInitialCategoryId"
  | "loanBorrowedPrincipalCategoryId"
  | "loanBorrowedInterestCategoryId"
  | "loanBorrowedPrepayFeeCategoryId"
  | "loanLentInitialCategoryId"
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
