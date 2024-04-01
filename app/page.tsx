import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import prisma from "../lib/prisma";

const formatVND = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export default async function Home({}) {
  const transactions = await prisma.transaction.findMany({
    select: {
      category: true,
      date: true,
      id: true,
      value: true,
    },
  });
  const [{balance}] = await prisma.$queryRaw`SELECT 
  (SELECT COALESCE(SUM(value), 0) FROM "Transaction" WHERE "categoryId" IN (SELECT id FROM "Category" WHERE "type" = 'INCOME')) - 
  (SELECT COALESCE(SUM(value), 0) FROM "Transaction" WHERE "categoryId" IN (SELECT id FROM "Category" WHERE "type" = 'EXPENSE')) AS balance;
`
console.log(balance)
  return (
    <div>
      <div>Wealth Manager</div>
      <div>Balance</div>
      <div>{formatVND(balance)}</div>
      <div>Transactions</div>
      {transactions.map((transaction) => (
        <div
          className="flex gap-4 p-4 border-2 border-red-50"
          key={transaction.id}
        >
          <div>{dayjs(transaction.date).fromNow()}</div>
          <div>{formatVND(transaction.value)}</div>
          <div>{transaction.category.name}</div>
        </div>
      ))}
    </div>
  );
}
