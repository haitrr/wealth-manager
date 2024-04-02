import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import prisma from "../lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

const formatVND = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export default async function Home({}) {
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
    }
  });
  const [{balance}] = await prisma.$queryRaw`SELECT 
  (SELECT COALESCE(SUM(value), 0) FROM "Transaction" WHERE "categoryId" IN (SELECT id FROM "Category" WHERE "type" = 'INCOME')) - 
  (SELECT COALESCE(SUM(value), 0) FROM "Transaction" WHERE "categoryId" IN (SELECT id FROM "Category" WHERE "type" = 'EXPENSE')) AS balance;
` as {balance: Decimal}[];

  return (
    <div>
      <div>Wealth Manager</div>
      <div>Balance</div>
      <div>{formatVND(balance.toNumber())}</div>
      <div>Transactions</div>
      {transactions.map((transaction) => (
        <div
          className={`flex gap-4 p-4 border-2 border-red-50 ${transaction.category.type === "INCOME" ? "text-green-300" : "text-red-300"}`}
          key={transaction.id}
        >
          <div>{dayjs(transaction.date).format("DD-MM")}</div>
          <div>{formatVND(transaction.value.toNumber())}</div>
          <div>{transaction.category.name}</div>
        </div>
      ))}
    </div>
  );
}
