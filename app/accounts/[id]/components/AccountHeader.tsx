import { AccountType } from "@prisma/client";
import { AccountCard } from "./AccountCard";
import { DebtInfoGrid } from "./DebtInfoGrid";
import { ProgressBar } from "./ProgressBar";

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
  debt: {
    name: string;
    principalAmount: number;
    interestRate: number;
    startDate: Date;
    dueDate: Date;
  };
  type: 'borrowing' | 'loan';
}

function DebtAccount({ debt, type }: DebtAccountProps) {
  const remaining = debt.principalAmount;
  const progress = ((debt.principalAmount - remaining) / debt.principalAmount) * 100;
  
  const config = {
    borrowing: {
      emoji: "📉",
      badge: "Debt",
      titleColor: "text-destructive",
      progressLabel: "Remaining",
      progressAmount: remaining,
      progressPercentage: Math.max(0, 100 - progress),
      progressColorClass: "bg-destructive"
    },
    loan: {
      emoji: "📈",
      badge: "Loan",
      titleColor: "text-primary",
      progressLabel: "Collected",
      progressAmount: debt.principalAmount - remaining,
      progressPercentage: progress,
      progressColorClass: "bg-primary"
    }
  };
  
  const { emoji, badge, titleColor, progressLabel, progressAmount, progressPercentage, progressColorClass } = config[type];
  
  return (
    <AccountCard
      title={debt.name}
      emoji={emoji}
      badge={badge}
      titleColor={titleColor}
    >
      <DebtInfoGrid debt={debt} />
      <ProgressBar
        label={progressLabel}
        amount={progressAmount}
        percentage={progressPercentage}
        colorClass={progressColorClass}
      />
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
      return <DebtAccount debt={debt} type="borrowing" />;

    case AccountType.LOAN:
      const loan = account.debt;
      if (!loan) return <div>No loan information available</div>;
      return <DebtAccount debt={loan} type="loan" />;

    default:
      return <div>Unknown account type</div>;
  }
}