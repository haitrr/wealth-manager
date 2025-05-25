import { CategoryType } from "./types";

export const formatVND = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};


export const getColorVariant = (amount: number, categoryType: CategoryType | undefined = undefined) => {
  if (categoryType) {
    if (categoryType === "INCOME" || categoryType === "LOAN" || categoryType === "DEBT_COLLECTION") {
      return "positive"
    }
    return "negative"
  }
  return amount >= 0 ? "positive" : "negative";
}