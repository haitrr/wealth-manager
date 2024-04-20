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
  return (
    <div className="flex justify-between">
      <div>{budget.name}</div>
      <Money value={used._sum.value?.toNumber() ?? 0} />
      <Money value={budget.value.toNumber()} />
    </div>
  );
}
