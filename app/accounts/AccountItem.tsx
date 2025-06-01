import { Account, AccountType } from "@prisma/client";
import { CashAccountItem } from "./components/CashAccountItem";
import { BorrowingAccountItem } from "./components/BorrowingAccountItem";
import { LoanAccountItem } from "./components/LoanAccountItem";

interface AccountItemProps {
  account: Account & {
    debt?: {
      name: string;
      principalAmount: number;
      interestRate: number;
      startDate: Date;
      dueDate: Date;
    } | null;
  };
  onClick: (id: string) => void;
}

export default function AccountItem({ account, onClick }: AccountItemProps) {
  switch (account.type) {
    case AccountType.CASH:
      return <CashAccountItem account={account} onClick={onClick} />;
    case AccountType.BORROWING:
      return <BorrowingAccountItem account={account} onClick={onClick} />;
    case AccountType.LOAN:
      return <LoanAccountItem account={account} onClick={onClick} />;
    default:
      return <div>Unknown account type</div>;
  }
}