import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import TransactionsList from "./TransactionsList";
import AccountBalance from "./AccountBalance";
import prisma from "@/lib/prisma";
import TransactionForm from "./TransactionForm";
import { formatVND } from "@/utils/currency";

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

  const totalIncome =  transactions.filter((transaction) => transaction.category.type === "INCOME").reduce((acc, transaction) => acc + transaction.value.toNumber(), 0);
  const totalExpense = transactions.filter((transaction) => transaction.category.type === "EXPENSE").reduce((acc, transaction) => acc + transaction.value.toNumber(), 0);
  const netIncome = totalIncome - totalExpense;

  return (
    <div>
      <div>Wealth Manager</div>
      <div>Balance</div>
      <AccountBalance />
      <div>Income</div>
      <div>{formatVND(totalIncome)}</div>
      <div>Expense</div>
      <div>{formatVND(totalExpense)}</div>
      <div>Net Income</div>
      <div>{formatVND(netIncome)}</div>
      <TransactionForm categories={categories}/>
      <div>Transactions</div>
      <TransactionsList transactions={transactions} />
    </div>
  );
}
