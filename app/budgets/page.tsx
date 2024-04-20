import prisma from "@/lib/prisma";
import { Money } from "../Money";

export default async function BudgetPage() {
  const budgets = await prisma.budget.findMany();
  return (
    <div className="p-2 ">
      <div className="flex justify-center">
        <h1>Budgets</h1>
      </div>
      <div >
        {budgets.map((budget) => {
          return (
            <div className="flex justify-between" key={budget.id}>
              <div>{budget.name}</div>
              <Money value={budget.value.toNumber()} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
