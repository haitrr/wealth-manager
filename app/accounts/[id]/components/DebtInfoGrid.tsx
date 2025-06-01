"use client";

import { useState, useEffect } from "react";
import { formatVND } from "@/utils/currency";

interface DebtInfoGridProps {
  debt: {
    principalAmount: number;
    interestRate: number;
    startDate: Date;
    dueDate: Date;
  };
  accountId: string;
}

export function DebtInfoGrid({ debt, accountId }: DebtInfoGridProps) {
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
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <p className="text-sm text-muted-foreground">Principal Amount</p>
        <p className="text-lg font-semibold text-foreground">{formatVND(debt.principalAmount)}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Remaining Amount</p>
        <p className="text-lg font-semibold text-foreground">{formatVND(remainingAmount ?? debt.principalAmount)}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Interest Rate</p>
        <p className="text-lg font-semibold text-foreground">{(debt.interestRate * 100).toFixed(1)}%</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Paid Amount</p>
        <p className="text-lg font-semibold text-foreground">{formatVND(debt.principalAmount - (remainingAmount ?? debt.principalAmount))}</p>
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