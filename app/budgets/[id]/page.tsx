import prisma from "@/lib/prisma";
import {getBudgetSpentAmount} from "../BudgetItem";
import {getBudgetEndDate} from "@/utils/date";
import {BudgetChart} from "./BudgetChart";
import TransactionsList from "@/app/TransactionsList";
import {getAllBudgetCategoriesIds} from "@/utils/budget";
import {Budget} from "@/utils/types";
import EditBudgetButton from "./EditBudgetButton";
import BudgetHeader from "./components/BudgetHeader";

type Props = {
  params: {id: string};
};

export default async function BudgetDetailPage({params}: Props) {
  const {id} = params;
  const budgetP = await prisma.budget.findUnique({
    where: {id},
    include: {categories: {select: {id: true}}},
  });
  if (!budgetP) {
    return <div>Not found</div>;
  }
  const budget: Budget = {...budgetP, value: budgetP.value.toNumber()};

  const categoryIds = await getAllBudgetCategoriesIds(budget);

  if (!budget) {
    return <div>Not found</div>;
  }
  const spent = await getBudgetSpentAmount(budget);
  const left = budget.value - spent;

  const transactions = await getTransactions(budget, categoryIds);

  return (
    <div className="min-h-full bg-gray-900">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <BudgetHeader budget={budget} spent={spent} left={left} />
        
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Spending Chart</h2>
          <BudgetChart budget={budget} transactions={transactions} />
        </div>
        
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Recent Transactions</h2>
          <TransactionsList transactions={transactions} />
        </div>
        
        <div className="flex justify-center pt-4">
          <EditBudgetButton id={budget.id} />
        </div>
      </div>
    </div>
  );
}
async function getTransactions(budget: Budget, categoryIds: string[]) {
  const trans = await prisma.transaction.findMany({
    where: {
      date: {
        gte: budget.startDate,
        lt: getBudgetEndDate(budget),
      },
      category: {
        id: {
          in: categoryIds,
        },
      },
    },
    select: {
      id: true,
      category: true,
      value: true,
      date: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return trans.map((t) => {
    return {...t, value: t.value.toNumber()};
  });
}
