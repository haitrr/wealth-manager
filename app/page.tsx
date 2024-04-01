import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import prisma from "../lib/prisma";

export default async function Home({}) {
  const transactions = await prisma.transaction.findMany({
    select: {
      category: true,
      date: true,
      id: true,
      value: true,
    },
  });
  const balance = 75000;
  return (
    <div>
      <div>Wealth Manager</div>
      <div>Balance</div>
      <div>{balance}</div>
      <div>Transactions</div>
      {transactions.map((transaction) => (
        <div
          className="flex gap-4 p-4 border-2 border-red-50"
          key={transaction.id}
        >
          <div>{dayjs(transaction.date).fromNow()}</div>
          <div>{transaction.value.toString()}</div>
          <div>{transaction.category.name}</div>
        </div>
      ))}
    </div>
  );
}
