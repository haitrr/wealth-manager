import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
import TransactionsList from "./TransactionsList";
import AccountBalance from "./AccountBalance";
import prisma from "@/lib/prisma";
import {Money} from "./Money";
import {AddTransactionButton} from "./AddTransactionButton";
import { Separator } from "@/components/ui/separator";

const getThisMonthTransactions = async () => {
  const transactions = await prisma.transaction.findMany({
    where: {
      AND: [
        {
          date: {
            // show transactions from the beginning of the month
            gte: dayjs().startOf("month").toDate(),
          },
        },
        {
          date: {
            // show transactions from the beginning of the month
            lt: dayjs().endOf("month").toDate(),
          },
        },
      ],
    },
    select: {
      category: true,
      date: true,
      id: true,
      value: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return transactions.map((transaction) => {
    return {
      ...transaction,
      value: transaction.value.toNumber(),
    };
  });
};

export default async function Home({}) {
  const transactions = await getThisMonthTransactions();
  const totalIncome = transactions
    .filter((transaction) => {
      return (
        transaction.category.type === "INCOME" ||
        transaction.category.type === "LOAN" ||
        transaction.category.type === "DEBT_COLLECTION"
      );
    })
    .reduce((acc, transaction) => acc + transaction.value, 0);
  const totalExpense = transactions
    .filter((transaction) => {
      return (
        transaction.category.type === "EXPENSE" ||
        transaction.category.type === "DEBT" ||
        transaction.category.type === "LOAN_PAYMENT"
      );
    })
    .reduce((acc, transaction) => acc + transaction.value, 0);
  const netIncome = totalIncome - totalExpense;

  return (
    <div className="h-full">
      <div className="flex p-1 flex-col items-center">
        <div>Balance</div>
        <AccountBalance />
      </div>
      <div className="rounded p-2">
        <div className="flex justify-between p-2">
          <div>Income</div>
          <Money value={totalIncome} />
        </div>
        <div className="flex justify-between p-2">
          <div>Expense</div>
          <Money value={-totalExpense} />
        </div>
        <div className="flex justify-between p-2 ">
          <div>Net Income</div>
          <Money value={netIncome} />
        </div>
      </div>
      <Separator/>
      <TransactionsList transactions={transactions} />
      <AddTransactionButton />
    </div>
  );
}
