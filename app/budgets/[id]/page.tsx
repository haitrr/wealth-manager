import {Money} from "@/app/Money";
import prisma from "@/lib/prisma";
import {BudgetProgress} from "../BudgetProgress";
import {getBudgetSpentAmount} from "../BudgetItem";

export default async function BudgetDetailPage({params}) {
  const {id} = params;
  const budget = await prisma.budget.findUnique({
    where: {id},
    include: {categories: {select: {id: true}}},
  });
  if (!budget) {
    return <div>Not found</div>;
  }
  const spent = await getBudgetSpentAmount(budget);
  const left = budget.value.toNumber() - spent;

  return (
    <div>
      <div className="flex p-2 flex-col gap-1 justify-center text-lg items-center">
        <div>{budget.name}</div>
        <Money value={budget.value.toNumber()} />
        <div className="flex justify-between w-full">
          <div >
            <span>Spent</span>
            <Money value={spent} />
          </div>
          <div className="flex flex-col items-end justify-end">
            <div>Left</div>
            <Money value={left} />
          </div>
        </div>
        <BudgetProgress budget={budget} />
      </div>
    </div>
  );
}
