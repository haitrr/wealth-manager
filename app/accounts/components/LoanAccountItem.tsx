"use client";

import { useState, useEffect } from "react";
import { formatVND } from "@/utils/currency";
import { Account } from "@prisma/client";

interface LoanAccountItemProps {
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

export function LoanAccountItem({ account, onClick }: LoanAccountItemProps) {
  const [remainingAmount, setRemainingAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const loan = account.debt;
  
  useEffect(() => {
    const fetchRemainingAmount = async () => {
      if (!loan) return;
      
      try {
        const response = await fetch(`/api/accounts/${account.id}/remaining`);
        if (!response.ok) throw new Error('Failed to fetch remaining amount');
        
        const data = await response.json();
        setRemainingAmount(data.remainingAmount);
      } catch (error) {
        console.error('Error fetching remaining amount:', error);
        setRemainingAmount(loan.principalAmount);
      } finally {
        setLoading(false);
      }
    };

    fetchRemainingAmount();
  }, [account.id, loan]);
  
  if (!loan) {
    return (
      <li className="p-4 border rounded-lg shadow-sm bg-card border-border">
        <div className="text-muted-foreground">No loan information available</div>
      </li>
    );
  }

  const remaining = remainingAmount ?? loan.principalAmount;
  const progressPercentage = loading ? 0 : ((loan.principalAmount - remaining) / loan.principalAmount) * 100;

  return (
    <li
      className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-card border-border"
      onClick={() => onClick(account.id)}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-primary">📈 {loan.name}</h3>
          {account.default && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium">
              Default
            </span>
          )}
        </div>
        <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded">Loan</span>
      </div>
      
      <div className="flex justify-between mb-1">
        <span className="text-sm text-muted-foreground">Outstanding:</span>
        <span className="text-sm font-medium text-primary">
          {loading ? "Loading..." : formatVND(remaining)}
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2.5 mb-3">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${loading ? 'bg-muted-foreground/30 animate-pulse' : 'bg-primary'}`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Principal: {formatVND(loan.principalAmount)}</div>
        <div>Rate: {(loan.interestRate * 100).toFixed(1)}%</div>
        <div>Start: {new Date(loan.startDate).toLocaleDateString()}</div>
        <div>Due: {new Date(loan.dueDate).toLocaleDateString()}</div>
      </div>
    </li>
  );
}