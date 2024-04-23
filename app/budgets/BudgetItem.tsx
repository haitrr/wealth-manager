import prisma from "@/lib/prisma";
import {Money} from "../Money";
import {Budget} from "@prisma/client";
import {getBudgetEndDate} from "@/utils/date";
import { BudgetProgress } from "./BudgetProgress";
import Link from "next/link";
type Props = {
  budget: Budget & {categories: {id: string}[]};
};

export async function BudgetItem({budget}: Props) {
  const spent = await getBudgetSpentAmount(budget);
  const left = budget.value.toNumber() - spent;
  return (
    <Link href={`/budgets/${budget.id}`}>
    <div className="bg-gray-900 p-2 rounded">
      <div className="flex justify-between items-center">
        <div>{budget.name}</div>
        <div className="flex flex-col justify-end items-end">
          <Money value={budget.value.toNumber()} />
          <div className="flex gap-1 items-center">
            <span className="text-gray-500">
              {left > 0 ? "Left" : "Overspent"}
            </span>
            <Money value={left} />
          </div>
        </div>
      </div>
      <BudgetProgress
        budget={budget}
      />
    </div>
    </Link>
  );
}

export const getBudgetSpentAmount = async (budget: Budget & {categories: {id: string}[]}) => {
  const endDate = getBudgetEndDate(budget);
  const used =  await prisma.transaction.aggregate({
    where: {
      AND: [
        {date: {gte: budget.startDate}},
        {date: {lt: endDate}},
        {
          category: {
            id: {in: budget.categories.map((category) => category.id)},
          },
        },
      ],
    },
    _sum: {value: true},
  });
  return used._sum.value?.toNumber() ?? 0;
}