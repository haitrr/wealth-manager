
export const formatVND = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};


export const getColor = (amount: number) => {
  return amount >= 0 ? "text-green-500" : "text-red-500";
}