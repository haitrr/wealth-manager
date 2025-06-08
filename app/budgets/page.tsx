import prisma from "@/lib/prisma";
import {BudgetItem} from "./BudgetItem";
import {AddBudgetButton} from "./AddBudgetButton";
import {BudgetHeader} from "./components/BudgetHeader";
import {EmptyBudgetState} from "./components/EmptyBudgetState";

export default async function BudgetPage() {
  const budgets = await prisma.budget.findMany({include: {categories: true}});
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <BudgetHeader />

        {/* Budgets Grid */}
        <div className="flex gap-2 flex-col">
          {budgets.length > 0 ? (
            budgets.map((budget) => (
              <BudgetItem
                key={budget.id}
                budget={{...budget, value: budget.value.toNumber()}}
              />
            ))
          ) : (
            <EmptyBudgetState />
          )}
        </div>

        {/* Add Budget Button */}
        <div className="flex justify-center">
          <AddBudgetButton />
        </div>
      </div>
    </div>
  );
}
