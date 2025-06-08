import AccountBalance from "../AccountBalance";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import { BalanceChart } from "./BalanceChart";

const getBalanceData = async () => {
  // Get transactions for the current month
  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: dayjs().startOf("month").toDate(),
        lt: dayjs().endOf("month").toDate(),
      },
    },
    select: {
      id: true,
      date: true,
      value: true,
      category: {
        select: {
          type: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Calculate initial balance (balance at start of month)
  // This would be the sum of all transactions before this month
  const previousTransactions = await prisma.transaction.findMany({
    where: {
      date: {
        lt: dayjs().startOf("month").toDate(),
      },
    },
    select: {
      value: true,
      category: {
        select: {
          type: true,
        },
      },
    },
  });

  let initialBalance = 0;
  previousTransactions.forEach(t => {
    const isIncome = ['INCOME', 'LOAN_COLLECTION', 'LOAN_INTEREST_COLLECTION'].includes(t.category.type);
    const isExpense = ['EXPENSE', 'BORROWING_PAYMENT', 'BORROWING_INTEREST_PAYMENT'].includes(t.category.type);
    
    if (isIncome) {
      initialBalance += t.value.toNumber();
    } else if (isExpense) {
      initialBalance -= t.value.toNumber();
    } else if (t.category.type === 'BORROWING') {
      initialBalance += t.value.toNumber();
    } else if (t.category.type === 'LOAN') {
      initialBalance -= t.value.toNumber();
    }
  });

  return {
    transactions: transactions.map(t => ({
      ...t,
      value: t.value.toNumber(),
    })),
    initialBalance,
  };
};

export default async function BalanceCard() {
  const { transactions, initialBalance } = await getBalanceData();

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 mb-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Total Balance</h1>
        <div className="text-3xl font-bold text-blue-400">
          <AccountBalance />
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Balance Trend This Month</h3>
        <BalanceChart transactions={transactions} initialBalance={initialBalance} />
      </div>
    </div>
  );
}