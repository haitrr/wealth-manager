import { AccountType } from "@prisma/client";
import { AccountCard } from "./AccountCard";
import { DebtInfoGrid } from "./DebtInfoGrid";
import { DebtProgress } from "./DebtProgress";
import { SetDefaultButton } from "./SetDefaultButton";

interface AccountHeaderProps {
  account: {
    id: string;
    name: string;
    type: AccountType;
    default: boolean;
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
  account: {
    id: string;
    default: boolean;
  };
  debt: {
    name: string;
    principalAmount: number;
    interestRate: number;
    startDate: Date;
    dueDate: Date;
  };
  type: 'borrowing' | 'loan';
}

function DebtAccount({ account, debt, type }: DebtAccountProps) {
  return (
    <AccountCard
      title={debt.name}
      emoji={type === 'borrowing' ? "📉" : "📈"}
      badge={type === 'borrowing' ? "Debt" : "Loan"}
      titleColor={type === 'borrowing' ? "text-destructive" : "text-primary"}
      actions={<SetDefaultButton accountId={account.id} isDefault={account.default} />}
    >
      <DebtInfoGrid debt={debt} accountId={account.id} />
      <DebtProgress debt={debt} accountId={account.id} type={type} />
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
          actions={<SetDefaultButton accountId={account.id} isDefault={account.default} />}
        >
          <p className="text-muted-foreground">Manage your cash transactions and view balance history.</p>
        </AccountCard>
      );

    case AccountType.BORROWING:
      const debt = account.debt;
      if (!debt) return <div>No debt information available</div>;
      return <DebtAccount account={{ id: account.id, default: account.default }} debt={debt} type="borrowing" />;

    case AccountType.LOAN:
      const loan = account.debt;
      if (!loan) return <div>No loan information available</div>;
      return <DebtAccount account={{ id: account.id, default: account.default }} debt={loan} type="loan" />;

    default:
      return <div>Unknown account type</div>;
  }
}