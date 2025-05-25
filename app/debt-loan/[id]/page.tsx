"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatVND } from "@/utils/currency";

interface DebtLoan {
  id: string;
  name: string;
  amount: number;
  paidAmount?: number;
  startDate?: string;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string;
  type?: "debt" | "loan";
}

interface Transaction {
  id: string;
  date: string;
  value: number;
  category: {
    id: string;
    name: string;
    type: string;
  };
}

export default function DebtLoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [debtLoan, setDebtLoan] = useState<DebtLoan | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDebtLoanDetails() {
      try {
        // Fetch the debt/loan details
        const response = await fetch(`/api/debt-loans/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch debt/loan details");
        }
        const data = await response.json();
        setDebtLoan({
          ...data,
          amount: parseFloat(data.amount),
          paidAmount: data.paidAmount ? parseFloat(data.paidAmount) : 0,
        });
        
        // Fetch related transactions
        const transactionsResponse = await fetch(`/api/debt-loans/${id}/transactions`);
        if (!transactionsResponse.ok) {
          throw new Error("Failed to fetch related transactions");
        }
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.map((tx: any) => ({
          ...tx,
          value: parseFloat(tx.value),
        })));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchDebtLoanDetails();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error || !debtLoan) {
    return <div className="container mx-auto p-4">Error: {error || "Debt/loan not found"}</div>;
  }

  // Calculate remaining balance
  const remainingBalance = debtLoan.amount - (debtLoan.paidAmount || 0);
  // Calculate progress percentage
  const progressPercentage = Math.min(100, Math.round((debtLoan.paidAmount || 0) / debtLoan.amount * 100));

  return (
    <div className="container mx-auto p-4">
      <button 
        onClick={() => router.back()} 
        className="mb-4 flex items-center text-blue-500 hover:text-blue-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
        Back
      </button>

      <h1 className="text-2xl font-bold mb-2">{debtLoan.name}</h1>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total Amount</p>
            <p className="text-xl font-semibold">{formatVND(debtLoan.amount)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Paid Amount</p>
            <p className="text-xl font-semibold text-green-500">{formatVND(debtLoan.paidAmount || 0)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Remaining</p>
            <p className="text-xl font-semibold text-red-500">{formatVND(remainingBalance)}</p>
          </div>
          {debtLoan.startDate && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Start Date</p>
              <p>{formatDate(debtLoan.startDate)}</p>
            </div>
          )}
          {debtLoan.interestRate !== undefined && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Interest Rate</p>
              <p>{debtLoan.interestRate}%</p>
            </div>
          )}
          {debtLoan.minimumPayment !== undefined && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Minimum Payment</p>
              <p>{formatVND(debtLoan.minimumPayment)}</p>
            </div>
          )}
          {debtLoan.dueDate && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Due Date</p>
              <p>{formatDate(debtLoan.dueDate)}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Transactions</h2>
      {transactions.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No transactions found for this {debtLoan.type || "item"}.</p>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {transactions.map((transaction) => (
                <tr 
                  key={transaction.id}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => router.push(`/transactions/${transaction.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.category.name}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right ${
                    transaction.category.type === "DEBT" || transaction.category.type === "LOAN_PAYMENT" ? 
                    "text-red-500" : "text-green-500"
                  }`}>
                    {formatVND(transaction.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => router.push(`/transactions/add?debtLoanId=${id}`)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
        >
          Add New Transaction
        </button>
      </div>
    </div>
  );
}