import prisma from "@/lib/prisma";
import { getBudgetEndDate } from "@/utils/date";
import { Budget } from "@prisma/client";
import dayjs from "dayjs";

type Props = {
  budget: Budget & {categories: {id: string}[]};
};

export async function BudgetProgress({budget}: Props) {
  const startDate = budget.startDate;
  const endDate = getBudgetEndDate(budget);
  const value = budget.value.toNumber();
  const used = await prisma.transaction.aggregate({
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
  const spent = used._sum.value?.toNumber() ?? 0;
  const now = new Date();
  const totalDays =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const daysPassed =
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const budgetPerDay = value / totalDays;
  const percentPassed = (daysPassed / totalDays) * 100;
  const left = value - spent;
  const progress = Math.min(1, spent / value) * 100;
  const expectedLeft = value - budgetPerDay * daysPassed;
  console.log(left, expectedLeft, left - expectedLeft);
  const progressColor = expectedLeft > left ? "bg-red-500" : "bg-green-500";
  return (
    <div className="flex-1 h-2 w-full relative bg-gray-800 rounded-full mb-2">
      <div
        className={`h-2 w-full ${progressColor} rounded-full`}
        style={{width: `${progress}%`}}
      />
      <div
        className="absolute"
        style={{left: `${percentPassed}%`, top: "-2px"}}
      >
        <div className="h-3 w-1 rounded bg-slate-500"></div>
        <div className="text-xs">Today</div>
      </div>
    </div>
  );
}