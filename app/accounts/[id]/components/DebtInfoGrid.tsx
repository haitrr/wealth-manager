import { formatVND } from "@/utils/currency";

interface DebtInfoGridProps {
  debt: {
    principalAmount: number;
    interestRate: number;
    startDate: Date;
    dueDate: Date;
  };
}

export function DebtInfoGrid({ debt }: DebtInfoGridProps) {
  return (
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
  );
}