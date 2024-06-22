import prisma from "@/lib/prisma";
import {BudgetItem} from "./BudgetItem";

export default async function BudgetPage() {
  const budgets = await prisma.budget.findMany({include: {categories: true}});
  return (
    <div className="p-2">
      <div className="flex justify-center text-lg">
        <h1>Budgets</h1>
      </div>
      <div className="flex gap-1 flex-col">
        {budgets.map((budget) => {
          return (
            <BudgetItem
              key={budget.id}
              budget={{...budget, value: budget.value.toNumber()}}
            />
          );
        })}
      </div>
    </div>
  );
}
