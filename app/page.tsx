import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import TransactionsList from "./TransactionsList";
import AccountBalance from "./AccountBalance";
import prisma from "@/lib/prisma";
import TransactionForm from "./TransactionForm";

export default async function Home({}) {
  const categories = await prisma.category.findMany();
  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        // show transactions from the beginning of the month
        gte: dayjs().set("date", 1).toDate(),
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
      <div>Wealth Manager</div>
      <div>Balance</div>
      <AccountBalance />
      <TransactionForm categories={categories}/>
      <div>Transactions</div>
      <TransactionsList transactions={transactions} />
    </div>
  );
}
