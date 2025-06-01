import { formatVND } from "@/utils/currency";
import { Account, AccountType } from "@prisma/client";

interface AccountItemProps {
  account: Account;
  onClick: (id: string) => void;
}

function CashAccountItem({ account, onClick }: AccountItemProps) {
  return (
    <li
      className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-green-50 border-green-200"
      onClick={() => onClick(account.id)}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-green-800">💰 {account.name}</h3>
        <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">Cash</span>
      </div>
      <div className="text-green-600">
        <p className="text-sm">Click to view transactions</p>
      </div>
    </li>
  );
}

function BorrowingAccountItem({ account, onClick }: AccountItemProps) {
  const debt = account.debt;
  
  if (!debt) {
    return (
      <li className="p-4 border rounded-lg shadow-sm bg-red-50 border-red-200">
        <div className="text-red-600">No debt information available</div>
      </li>
    );
  }

  const remainingAmount = debt.principalAmount; // This would need calculation based on payments
  const progressPercentage = ((debt.principalAmount - remainingAmount) / debt.principalAmount) * 100;

  return (
    <li
      className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-red-50 border-red-200"
      onClick={() => onClick(account.id)}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-red-800">📉 {debt.name}</h3>
        <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded">Debt</span>
      </div>
      
      <div className="flex justify-between mb-1">
        <span className="text-sm text-red-600">Remaining:</span>
        <span className="text-sm font-medium text-red-700">{formatVND(remainingAmount)}</span>
      </div>
      
      <div className="w-full bg-red-200 rounded-full h-2.5 mb-3">
        <div 
          className="bg-red-600 h-2.5 rounded-full" 
          style={{ width: `${Math.max(0, 100 - progressPercentage)}%` }}
        ></div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-red-600">
        <div>Principal: {formatVND(debt.principalAmount)}</div>
        <div>Rate: {(debt.interestRate * 100).toFixed(1)}%</div>
        <div>Start: {new Date(debt.startDate).toLocaleDateString()}</div>
        <div>Due: {new Date(debt.dueDate).toLocaleDateString()}</div>
      </div>
    </li>
  );
}

function LoanAccountItem({ account, onClick }: AccountItemProps) {
  const loan = account.debt;
  
  if (!loan) {
    return (
      <li className="p-4 border rounded-lg shadow-sm bg-blue-50 border-blue-200">
        <div className="text-blue-600">No loan information available</div>
      </li>
    );
  }

  const remainingAmount = loan.principalAmount; // This would need calculation based on collections
  const progressPercentage = ((loan.principalAmount - remainingAmount) / loan.principalAmount) * 100;

  return (
    <li
      className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-blue-50 border-blue-200"
      onClick={() => onClick(account.id)}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-blue-800">📈 {loan.name}</h3>
        <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">Loan</span>
      </div>
      
      <div className="flex justify-between mb-1">
        <span className="text-sm text-blue-600">Outstanding:</span>
        <span className="text-sm font-medium text-blue-700">{formatVND(remainingAmount)}</span>
      </div>
      
      <div className="w-full bg-blue-200 rounded-full h-2.5 mb-3">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
        <div>Principal: {formatVND(loan.principalAmount)}</div>
        <div>Rate: {(loan.interestRate * 100).toFixed(1)}%</div>
        <div>Start: {new Date(loan.startDate).toLocaleDateString()}</div>
        <div>Due: {new Date(loan.dueDate).toLocaleDateString()}</div>
      </div>
    </li>
  );
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