import dayjs from "dayjs";
import prisma from "../lib/prisma";
import { formatVND } from "@/utils/currency";

const TransactionsList = async () => {
  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: dayjs().subtract(1, "month").toDate(),
      },
    },
    select: {
      category: true,
      date: true,
      id: true,
      value: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return (
    <div>
      {transactions.map((transaction) => (
        <div
          className={`flex gap-4 p-4 border-2 border-red-50 ${transaction.category.type === "INCOME"
              ? "text-green-300"
              : "text-red-300"}`}
          key={transaction.id}
        >
          <div>{dayjs(transaction.date).format("DD-MM")}</div>
          <div>{formatVND(transaction.value.toNumber())}</div>
          <div>{transaction.category.name}</div>
        </div>
      ))}
    </div>
  );
};

export default TransactionsList