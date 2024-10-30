import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import TransactionsList from "./TransactionsList";
import AccountBalance from "./AccountBalance";
import prisma from "@/lib/prisma";
import {Money} from "./Money";
import {AddTransactionButton} from "./AddTransactionButton";

const getThisMonthTransactions = async () => {
  const transactions = await prisma.transaction.findMany({
    where: {
      AND: [
        {
          date: {
            // show transactions from the beginning of the month
            gte: dayjs().startOf("month").toDate(),
          },
        },
        {
          date: {
            // show transactions from the beginning of the month
            lt: dayjs().endOf("month").toDate(),
          },
        },
      ],
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

  return transactions.map((transaction) => {
    return {
      ...transaction,
      value: transaction.value.toNumber(),
    };
  });
};

export default async function Home({}) {
  const transactions = await getThisMonthTransactions();
  const totalIncome = transactions
    .filter((transaction) => transaction.category.type === "INCOME")
    .reduce((acc, transaction) => acc + transaction.value, 0);
  const totalExpense = transactions
    .filter((transaction) => transaction.category.type === "EXPENSE")
    .reduce((acc, transaction) => acc + transaction.value, 0);
  const netIncome = totalIncome - totalExpense;

  return (
    <div>
      <div className="flex p-1 flex-col items-center">
        <div>Balance</div>
        <AccountBalance />
      </div>
      <div className="rounded">
        <div className="flex justify-between p-2">
          <div>Income</div>
          <Money value={totalIncome} />
        </div>
        <div className="flex justify-between p-2">
          <div>Expense</div>
          <Money value={-totalExpense} />
        </div>
        <div className="flex justify-between p-2 border-t border-gray-800">
          <div>Net Income</div>
          <Money value={netIncome} />
        </div>
      </div>
      <TransactionsList transactions={transactions} />
      <AddTransactionButton />
    </div>
  );
}
