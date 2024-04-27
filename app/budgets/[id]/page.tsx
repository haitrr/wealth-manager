import {Money} from "@/app/Money";
import prisma from "@/lib/prisma";
import {BudgetProgress} from "../BudgetProgress";
import {getBudgetSpentAmount} from "../BudgetItem";
import dayjs from "dayjs";
import { getBudgetEndDate } from "@/utils/date";
import { VegaLite, VisualizationSpec } from "react-vega";
import { BudgetChart } from "./BudgetChart";

type Props = {
    params: {id: string};
}

export default async function BudgetDetailPage({params}: Props) {
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
  const startDate = budget.startDate;
const endDate = getBudgetEndDate(budget);
const dayLeft = dayjs(endDate).diff(dayjs(), "day");

  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: budget.startDate,
        lt: getBudgetEndDate(budget),
      },
      category: {
        id: {
          in: budget.categories.map((category) => category.id),
        },
      },
    },
  });

  return (
    <div>
      <div className="flex p-4 flex-col gap-1 justify-center text-lg items-center">
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
      <div className="flex justify-start w-full flex-col">
        <div>{`${dayjs(startDate).format("DD/MM")} - ${dayjs(endDate).format("DD/MM")}`}</div>
        <div>{`${dayLeft} days left`}</div>
      </div>
      <BudgetChart budget={budget} transactions={transactions}/>
      </div>
    </div>
  );
}
