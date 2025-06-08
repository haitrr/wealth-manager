import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
import TransactionsList from "./TransactionsList";
import prisma from "@/lib/prisma";
import {AddTransactionButton} from "./AddTransactionButton";
import { EXPENSE_CATEGORY_TYPES, INCOME_CATEGORY_TYPES } from "@/lib/utils";
import FinancialSummaryCard from "./components/FinancialSummaryCard";
import BalanceCard from "./components/BalanceCard";

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
    .filter((transaction) => {
      return (
        INCOME_CATEGORY_TYPES.includes(transaction.category.type)
      );
    })
    .reduce((acc, transaction) => acc + transaction.value, 0);
  const totalExpense = transactions
    .filter((transaction) => {
      return (
        EXPENSE_CATEGORY_TYPES.includes(transaction.category.type)
      );
    })
    .reduce((acc, transaction) => acc + transaction.value, 0);
  const netIncome = totalIncome - totalExpense;

  return (
    <div className="min-h-full bg-gray-900">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Balance Section */}
        <BalanceCard />
        
        {/* Financial Summary */}
        <FinancialSummaryCard 
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netIncome={netIncome}
        />
        
        {/* Recent Transactions */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Recent Transactions</h2>
          <TransactionsList transactions={transactions} />
        </div>
        
        {/* Add Transaction Button */}
        <div className="flex justify-center pt-4">
          <AddTransactionButton />
        </div>
      </div>
    </div>
  );
}
