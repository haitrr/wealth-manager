import {Money} from "@/app/Money";
import prisma from "@/lib/prisma";
import {BudgetProgress} from "../BudgetProgress";
import {getBudgetSpentAmount} from "../BudgetItem";
import dayjs from "dayjs";
import {getBudgetEndDate} from "@/utils/date";
import {BudgetChart} from "./BudgetChart";
import TransactionsList from "@/app/TransactionsList";
import {getAllBudgetCategoriesIds} from "@/utils/budget";
import {Budget} from "@/utils/types";
import EditBudgetButton from "./EditBudgetButton";

type Props = {
  params: {id: string};
};

export default async function BudgetDetailPage({params}: Props) {
  const {id} = params;
  const budgetP = await prisma.budget.findUnique({
    where: {id},
    include: {categories: {select: {id: true}}},
  });
  if (!budgetP) {
    return <div>Not found</div>;
  }
  const budget: Budget = {...budgetP, value: budgetP.value.toNumber()};

  const categoryIds = await getAllBudgetCategoriesIds(budget);

  if (!budget) {
    return <div>Not found</div>;
  }
  const spent = await getBudgetSpentAmount(budget);
  const left = budget.value - spent;
  const startDate = budget.startDate;
  const endDate = getBudgetEndDate(budget);
  const dayLeft = dayjs(endDate).diff(dayjs(), "day");

  const transactions = await getTransactions(budget, categoryIds);

  return (
    <div className="h-full">
      <div className="flex p-4 flex-col gap-1 justify-center text-sm items-center">
        <div>{budget.name}</div>
        <Money value={budget.value} />
        <div className="flex justify-between w-full">
          <div>
            <span>Spent</span>
            <Money value={spent} />
          </div>
          <div className="flex flex-col items-end justify-end">
            <div>Left</div>
            <Money value={left} />
          </div>
        </div>
        <BudgetProgress budget={budget} />
        <div className="flex justify-start w-full flex-col text-sm pt-1">
          <div>{`${dayjs(startDate).format("DD/MM")} - ${dayjs(endDate).format(
            "DD/MM",
          )}`}</div>
          <div>{`${dayLeft} days left`}</div>
        </div>
        <BudgetChart budget={budget} transactions={transactions} />
        <TransactionsList transactions={transactions} />
        <EditBudgetButton id={budget.id} />
      </div>
    </div>
  );
}
async function getTransactions(budget: Budget, categoryIds: string[]) {
  const trans = await prisma.transaction.findMany({
    where: {
      date: {
        gte: budget.startDate,
        lt: getBudgetEndDate(budget),
      },
      category: {
        id: {
          in: categoryIds,
        },
      },
    },
    select: {
      id: true,
      category: true,
      value: true,
      date: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return trans.map((t) => {
    return {...t, value: t.value.toNumber()};
  });
}
