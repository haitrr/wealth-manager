"use client";

import { useState, useEffect } from "react";
import { ProgressBar } from "./ProgressBar";

interface DebtProgressProps {
  debt: {
    principalAmount: number;
  };
  accountId: string;
  type: 'borrowing' | 'loan';
}

export function DebtProgress({ debt, accountId, type }: DebtProgressProps) {
  const [remainingAmount, setRemainingAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRemainingAmount = async () => {
      try {
        const response = await fetch(`/api/accounts/${accountId}/remaining`);
        if (!response.ok) throw new Error('Failed to fetch remaining amount');
        
        const data = await response.json();
        setRemainingAmount(data.remainingAmount);
      } catch (error) {
        console.error('Error fetching remaining amount:', error);
        setRemainingAmount(debt.principalAmount);
      } finally {
        setLoading(false);
      }
    };

    fetchRemainingAmount();
  }, [accountId, debt.principalAmount]);

  if (loading) {
    return (
      <div className="mb-2">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Loading...</span>
          <span>--%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div className="bg-muted-foreground/30 h-3 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  const remaining = remainingAmount ?? debt.principalAmount;
  const progress = ((debt.principalAmount - remaining) / debt.principalAmount) * 100;

  const config = {
    borrowing: {
      progressLabel: "Remaining",
      progressAmount: remaining,
      progressPercentage: Math.max(0, 100 - progress),
      progressColorClass: "bg-destructive"
    },
    loan: {
      progressLabel: "Collected",
      progressAmount: debt.principalAmount - remaining,
      progressPercentage: progress,
      progressColorClass: "bg-primary"
    }
  };

  const { progressLabel, progressAmount, progressPercentage, progressColorClass } = config[type];

  return (
    <ProgressBar
      label={progressLabel}
      amount={progressAmount}
      percentage={progressPercentage}
      colorClass={progressColorClass}
    />
  );
}