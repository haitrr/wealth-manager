import { formatVND } from "@/utils/currency";

interface ProgressBarProps {
  label: string;
  amount: number;
  percentage: number;
  colorClass: string;
}

export function ProgressBar({ label, amount, percentage, colorClass }: ProgressBarProps) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm text-muted-foreground mb-1">
        <span>{label}: {formatVND(amount)}</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-3">
        <div 
          className={`${colorClass} h-3 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}