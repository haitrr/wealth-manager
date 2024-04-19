import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import TransactionsList from "./TransactionsList";
import AccountBalance from "./AccountBalance";
import prisma from "@/lib/prisma";
import TransactionForm from "./TransactionForm";
import {formatVND, getColor} from "@/utils/currency";

const getThisMonthTransactions = async () => {
  const transactions = await prisma.transaction.findMany({
    where: {
      AND: [
        {
          date: {
            // show transactions from the beginning of the month
            gte: new Date(2024, 2, 1),
          },
        },
        {
          date: {
            // show transactions from the beginning of the month
            lt: new Date(2024, 3, 1),
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
  console.log(transactions);
  return transactions.map((transaction) => {
    return {
      ...transaction,
      value: transaction.value.toNumber(),
    };
  });
};

export default async function Home({}) {
  const categories = await prisma.category.findMany();
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
      <div className="bg-gray-900 rounded">
        <div className="flex justify-between p-2">
          <div>Income</div>
          <div className={`${getColor(totalIncome)}`}>
            {formatVND(totalIncome)}
          </div>
        </div>
        <div className="flex justify-between p-2">
          <div>Expense</div>
          <div className={`${getColor(-totalExpense)}`}>
            {formatVND(totalExpense)}
          </div>
        </div>
        <div className="flex justify-between p-2 border-t border-gray-800">
          <div>Net Income</div>
          <div className={`${getColor(-netIncome)}`}>
            {formatVND(netIncome)}
          </div>
        </div>
      </div>
      <TransactionForm categories={categories} />
      <div>Transactions</div>
      <TransactionsList transactions={transactions} />
    </div>
  );
}
