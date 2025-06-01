import { CategoryType } from "@prisma/client";
import { INCOME_CATEGORY_TYPES } from "../lib/utils";

export const formatVND = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};


export const getColorVariant = (amount: number, categoryType: CategoryType | undefined = undefined) => {
  if (categoryType) {
    if (INCOME_CATEGORY_TYPES.includes(categoryType)) {
      return "positive"
    }
    return "negative"
  }
  return amount >= 0 ? "positive" : "negative";
}