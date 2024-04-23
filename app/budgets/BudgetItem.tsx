import prisma from "@/lib/prisma";
import {Money} from "../Money";
import {Budget} from "@prisma/client";
import {getBudgetEndDate} from "@/utils/date";
type Props = {
  budget: Budget & {categories: {id: string}[]};
};

export async function BudgetItem({budget}: Props) {
  const endDate = getBudgetEndDate(budget);
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
  const left = budget.value.toNumber() - spent;
  return (
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
        startDate={budget.startDate}
        endDate={endDate}
        value={budget.value}
        spent={spent}
      />
    </div>
  );
}

function BudgetProgress({startDate, endDate, value, spent}) {
  const now = new Date();
  const totalDays =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const daysPassed =
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const budgetPerDay = value.toNumber() / totalDays;
  const percentPassed = (daysPassed / totalDays) * 100;
  const left = value.toNumber() - spent;
  const progress = Math.min(1, spent / value) * 100;
  const expectedLeft = value.toNumber() - budgetPerDay * daysPassed;
  console.log(left, expectedLeft, left - expectedLeft);
  const progressColor = expectedLeft > left ? "bg-red-500" : "bg-green-500";
  return (
    <div className="flex-1 h-2 relative bg-gray-800 rounded-full">
      <div
        className={`h-full ${progressColor} rounded-full`}
        style={{width: `${progress}%`}}
      />
      <div
        className="absolute"
        style={{left: `${percentPassed}%`, top: "-2px"}}
      >
        <div className="h-3 w-1 rounded bg-slate-500"></div>
        <div>Today</div>
      </div>
    </div>
  );
}
