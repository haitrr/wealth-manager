import prisma from "@/lib/prisma";
import {Money} from "../Money";
import {getBudgetEndDate} from "@/utils/date";
import {BudgetProgress} from "./BudgetProgress";
import Link from "next/link";
import {getAllBudgetCategoriesIds} from "@/utils/budget";
import { Budget } from "@prisma/client";
import { BudgetWithNumberValue } from "@/utils/types";
type Props = {
  budget: BudgetWithNumberValue;
};

export async function BudgetItem({budget}: Props) {
  const spent = await getBudgetSpentAmount(budget);
  const left = budget.value - spent;
  return (
    <Link href={`/budgets/${budget.id}`}>
      <div className="bg-secondary p-4 rounded">
        <div className="flex justify-between items-center">
          <div>{budget.name}</div>
          <div className="flex flex-col justify-end items-end">
            <Money value={budget.value} />
            <div className="flex gap-1 items-center">
              <span className="text-gray-500">
                {left > 0 ? "Left" : "Overspent"}
              </span>
              <Money value={left} />
            </div>
          </div>
        </div>
        <BudgetProgress budget={budget} />
      </div>
    </Link>
  );
}

export const getBudgetSpentAmount = async (
  budget: Pick<Budget, "startDate" | "period">,
) => {
  const endDate = getBudgetEndDate(budget);
  const categories = await getAllBudgetCategoriesIds(budget);
  const used = await prisma.transaction.aggregate({
    where: {
      AND: [
        {date: {gte: budget.startDate}},
        {date: {lt: endDate}},
        {
          category: {
            id: {in: categories},
          },
        },
      ],
    },
    _sum: {value: true},
  });
  return used._sum.value?.toNumber() ?? 0;
};
