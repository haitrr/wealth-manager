import { Transaction } from "@/utils/types";
import { CategoryIcon } from "./CategoryIcon";
import { Money } from "./Money";

type Props = {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: Props) {
  return (
    <div className="flex justify-between p-1">
      <div className="flex gap-1">
        <CategoryIcon />
        <div>{transaction.category.name}</div>
      </div>
      <Money
        value={transaction.value}
        categoryType={transaction.category.type} />
    </div>
  );
}
