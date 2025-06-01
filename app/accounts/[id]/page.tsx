import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Transaction } from "@/utils/types";
import { AccountHeader } from "./components/AccountHeader";
import { RecentTransactions } from "./components/RecentTransactions";
import { AccountNavigation } from "./components/AccountNavigation";

interface AccountDetailPageProps {
  params: { id: string };
}

async function getAccountWithTransactions(id: string) {
  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      debt: true,
      transactions: {
        orderBy: { date: 'desc' },
        take: 20, // Limit to recent transactions
        include: {
          category: true,
        }
      }
    }
  });

  if (!account) {
    return null;
  }

  return {
    ...account,
    transactions: account.transactions.map(transaction => ({
      ...transaction,
      value: transaction.value.toNumber(),
      category: {
        ...transaction.category,
        type: transaction.category.type as any // Type assertion to handle enum compatibility
      }
    }))
  };
}

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const account = await getAccountWithTransactions(params.id);

  if (!account) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <AccountNavigation />
        <AccountHeader account={account} />
      </div>

      <RecentTransactions 
        accountId={account.id} 
        transactions={account.transactions as Transaction[]} 
      />
    </div>
  );
}