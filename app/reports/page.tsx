import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import { EXPENSE_CATEGORY_TYPES, INCOME_CATEGORY_TYPES } from "@/lib/utils";
import { CategoryType } from "@prisma/client";
import IncomeExpenseChart from "./components/IncomeExpenseChart";
import CategoryBreakdownChart from "./components/CategoryBreakdownChart";
import MonthlyTrendChart from "./components/MonthlyTrendChart";

const getReportData = async () => {
  // Get current month transactions
  const currentMonthTransactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: dayjs().startOf("month").toDate(),
        lt: dayjs().endOf("month").toDate(),
      },
    },
    select: {
      id: true,
      value: true,
      date: true,
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  // Get last 6 months transactions for trend analysis
  const sixMonthsAgo = dayjs().subtract(5, 'month').startOf('month');
  const monthlyTransactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: sixMonthsAgo.toDate(),
        lt: dayjs().endOf("month").toDate(),
      },
    },
    select: {
      value: true,
      date: true,
      category: {
        select: {
          type: true,
        },
      },
    },
  });

  return {
    currentMonthTransactions: currentMonthTransactions.map(t => ({
      ...t,
      value: t.value.toNumber(),
    })),
    monthlyTransactions: monthlyTransactions.map(t => ({
      ...t,
      value: t.value.toNumber(),
    })),
  };
};

export default async function ReportsPage() {
  const { currentMonthTransactions, monthlyTransactions } = await getReportData();

  // Calculate current month totals
  const currentMonthIncome = currentMonthTransactions
    .filter(t => INCOME_CATEGORY_TYPES.includes(t.category.type))
    .reduce((sum, t) => sum + t.value, 0);

  const currentMonthExpense = currentMonthTransactions
    .filter(t => EXPENSE_CATEGORY_TYPES.includes(t.category.type))
    .reduce((sum, t) => sum + t.value, 0);

  // Group by categories for breakdown
  const incomeByCategory = currentMonthTransactions
    .filter(t => INCOME_CATEGORY_TYPES.includes(t.category.type))
    .reduce((acc, t) => {
      const categoryName = t.category.name;
      acc[categoryName] = (acc[categoryName] || 0) + t.value;
      return acc;
    }, {} as Record<string, number>);

  const expenseByCategory = currentMonthTransactions
    .filter(t => EXPENSE_CATEGORY_TYPES.includes(t.category.type))
    .reduce((acc, t) => {
      const categoryName = t.category.name;
      acc[categoryName] = (acc[categoryName] || 0) + t.value;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="min-h-full bg-gray-900">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Financial Reports</h1>
          <p className="text-gray-400 mt-2">
            Comprehensive analysis of your income and expenses
          </p>
        </div>

        {/* Income vs Expense Overview */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Income vs Expense - {dayjs().format("MMMM YYYY")}
          </h2>
          <IncomeExpenseChart 
            income={currentMonthIncome} 
            expense={currentMonthExpense} 
          />
        </div>

        {/* Monthly Trend */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            6-Month Trend
          </h2>
          <MonthlyTrendChart transactions={monthlyTransactions} />
        </div>

        {/* Category Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Breakdown */}
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              Income by Category
            </h2>
            <CategoryBreakdownChart 
              data={incomeByCategory} 
              type="income"
            />
          </div>

          {/* Expense Breakdown */}
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              Expense by Category
            </h2>
            <CategoryBreakdownChart 
              data={expenseByCategory} 
              type="expense"
            />
          </div>
        </div>
      </div>
    </div>
  );
}