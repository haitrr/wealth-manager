import { CategoryType } from "@prisma/client";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const LOAN_TRANSACTION_TYPES = [
  CategoryType.LOAN,
  CategoryType.LOAN_COLLECTION,
  CategoryType.LOAN_INTEREST_COLLECTION,
  CategoryType.LOAN_FEE_COLLECTION,
];

export const BORROWING_TRANSACTION_TYPES = [
  CategoryType.BORROWING,
  CategoryType.BORROWING_FEE_PAYMENT,
  CategoryType.BORROWING_PAYMENT,
  CategoryType.BORROWING_INTEREST_PAYMENT,
];

export const INCOME_CATEGORY_TYPES: CategoryType[] = [
  CategoryType.INCOME,
  CategoryType.LOAN_COLLECTION,
  CategoryType.LOAN_INTEREST_COLLECTION,
  CategoryType.LOAN_FEE_COLLECTION,
  CategoryType.BORROWING,
];

export const EXPENSE_CATEGORY_TYPES: CategoryType[] = [
  CategoryType.EXPENSE,
  CategoryType.BORROWING_PAYMENT,
  CategoryType.BORROWING_INTEREST_PAYMENT,
  CategoryType.BORROWING_FEE_PAYMENT,
  CategoryType.LOAN
];