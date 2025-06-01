import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { formatVND } from "@/utils/currency";
import { AccountType } from "@prisma/client";
import Link from "next/link";
import { TransactionItem } from "@/app/TransactionItem";
import { Transaction } from "@/utils/types";

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

  const renderAccountHeader = () => {
    switch (account.type) {
      case AccountType.CASH:
        return (
          <div className="bg-card border-border border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                💰 {account.name}
              </h1>
              <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                Cash Account
              </span>
            </div>
            <p className="text-muted-foreground">Manage your cash transactions and view balance history.</p>
          </div>
        );

      case AccountType.BORROWING:
        const debt = account.debt;
        if (!debt) return <div>No debt information available</div>;
        
        const debtRemaining = debt.principalAmount;
        const debtProgress = ((debt.principalAmount - debtRemaining) / debt.principalAmount) * 100;
        
        return (
          <div className="bg-card border-border border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-destructive flex items-center gap-2">
                📉 {debt.name}
              </h1>
              <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                Debt
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Principal Amount</p>
                <p className="text-lg font-semibold text-foreground">{formatVND(debt.principalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interest Rate</p>
                <p className="text-lg font-semibold text-foreground">{(debt.interestRate * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-lg font-semibold text-foreground">{new Date(debt.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="text-lg font-semibold text-foreground">{new Date(debt.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Remaining: {formatVND(debtRemaining)}</span>
                <span>{Math.max(0, 100 - debtProgress).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-destructive h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.max(0, 100 - debtProgress)}%` }}
                ></div>
              </div>
            </div>
          </div>
        );

      case AccountType.LOAN:
        const loan = account.debt;
        if (!loan) return <div>No loan information available</div>;
        
        const loanRemaining = loan.principalAmount;
        const loanProgress = ((loan.principalAmount - loanRemaining) / loan.principalAmount) * 100;
        
        return (
          <div className="bg-card border-border border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                📈 {loan.name}
              </h1>
              <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                Loan
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Principal Amount</p>
                <p className="text-lg font-semibold text-foreground">{formatVND(loan.principalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interest Rate</p>
                <p className="text-lg font-semibold text-foreground">{(loan.interestRate * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-lg font-semibold text-foreground">{new Date(loan.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="text-lg font-semibold text-foreground">{new Date(loan.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Collected: {formatVND(loan.principalAmount - loanRemaining)}</span>
                <span>{loanProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${loanProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown account type</div>;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/accounts" 
          className="text-primary hover:text-primary/80 flex items-center gap-1 mb-4"
        >
          ← Back to Accounts
        </Link>
        {renderAccountHeader()}
      </div>

      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <Link 
            href={`/accounts/${account.id}/transactions`}
            className="text-primary hover:text-primary/80 text-sm"
          >
            View All →
          </Link>
        </div>

        {account.transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No transactions found for this account.</p>
        ) : (
          <div className="space-y-0 border rounded-lg overflow-hidden">
            {account.transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction as Transaction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}