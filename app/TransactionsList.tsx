import dayjs from "dayjs";
import { formatVND } from "@/utils/currency";
import { Transaction } from "@/utils/types";

type Props = {
  transactions: Transaction[];
}

const TransactionsList = async ({transactions}: Props) => {
  return (
    <div>
      {transactions.map((transaction) => (
        <div
          className={`flex gap-4 p-4 border-2 border-red-50 ${transaction.category.type === "INCOME"
              ? "text-green-300"
              : "text-red-300"}`}
          key={transaction.id}
        >
          <div>{dayjs(transaction.date).format("MMM D")}</div>
          <div>{formatVND(transaction.value)}</div>
          <div>{transaction.category.name}</div>
        </div>
      ))}
    </div>
  );
};

export default TransactionsList