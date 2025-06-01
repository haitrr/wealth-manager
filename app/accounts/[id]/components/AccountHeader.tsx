import { AccountType } from "@prisma/client";
import { AccountCard } from "./AccountCard";
import { DebtInfoGrid } from "./DebtInfoGrid";
import { DebtProgress } from "./DebtProgress";

interface AccountHeaderProps {
  account: {
    id: string;
    name: string;
    type: AccountType;
    debt?: {
      name: string;
      principalAmount: number;
      interestRate: number;
      startDate: Date;
      dueDate: Date;
    } | null;
  };
}

interface DebtAccountProps {
  accountId: string;
  debt: {
    name: string;
    principalAmount: number;
    interestRate: number;
    startDate: Date;
    dueDate: Date;
  };
  type: 'borrowing' | 'loan';
}

function DebtAccount({ accountId, debt, type }: DebtAccountProps) {
  return (
    <AccountCard
      title={debt.name}
      emoji={type === 'borrowing' ? "📉" : "📈"}
      badge={type === 'borrowing' ? "Debt" : "Loan"}
      titleColor={type === 'borrowing' ? "text-destructive" : "text-primary"}
    >
      <DebtInfoGrid debt={debt} accountId={accountId} />
      <DebtProgress debt={debt} accountId={accountId} type={type} />
    </AccountCard>
  );
}

export function AccountHeader({ account }: AccountHeaderProps) {
  switch (account.type) {
    case AccountType.CASH:
      return (
        <AccountCard
          title={account.name}
          emoji="💰"
          badge="Cash Account"
          titleColor="text-foreground"
        >
          <p className="text-muted-foreground">Manage your cash transactions and view balance history.</p>
        </AccountCard>
      );

    case AccountType.BORROWING:
      const debt = account.debt;
      if (!debt) return <div>No debt information available</div>;
      return <DebtAccount accountId={account.id} debt={debt} type="borrowing" />;

    case AccountType.LOAN:
      const loan = account.debt;
      if (!loan) return <div>No loan information available</div>;
      return <DebtAccount accountId={account.id} debt={loan} type="loan" />;

    default:
      return <div>Unknown account type</div>;
  }
}