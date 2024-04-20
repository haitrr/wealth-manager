import { CategoryType } from "@prisma/client";

export const formatVND = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};


export const getColor = (amount: number, categoryType: CategoryType | undefined = undefined) => {
  if(categoryType) {
    if(categoryType === CategoryType.INCOME) {
      return "text-green-500"
    }
    return "text-red-500"
  }
  return amount >= 0 ? "text-green-500" : "text-red-500";
}