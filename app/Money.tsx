import {formatVND, getColorVariant} from "@/utils/currency";
import { CategoryType } from "@prisma/client";

type Props = {
  value: number;
  categoryType?: CategoryType;
  className?: string;
};

const colorVariants = {
  positive: "text-green-500",
  negative: "text-red-500",
};

export function Money({value, categoryType, className}: Props) {
  const color = getColorVariant(value, categoryType);
  return (
    <div className={`${colorVariants[color]} ${className} `}>
      {formatVND(Math.abs(value))}
    </div>
  );
}
