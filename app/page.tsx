import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import TransactionsList from "./TransactionsList";
import AccountBalance from "./AccountBalance";
import prisma from "@/lib/prisma";
import TransactionForm from "./TransactionForm";

export default async function Home({}) {
  const categories = await prisma.category.findMany();
  return (
    <div>
      <div>Wealth Manager</div>
      <div>Balance</div>
      <AccountBalance />
      <TransactionForm categories={categories}/>
      <div>Transactions</div>
      <TransactionsList />
    </div>
  );
}
