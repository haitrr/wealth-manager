import { formatVND, getColor } from "@/utils/currency";
import { CategoryType } from "@prisma/client";

type Props = {
  value: number;
  categoryType?: CategoryType;
  className?: string;
}
export function Money({ value, categoryType, className }: Props) {
  const color = getColor(value, categoryType);
  return (
    <div className={`${color} ${className}`}>{formatVND(Math.abs(value))}</div>
  );
}
