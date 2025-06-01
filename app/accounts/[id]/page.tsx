"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatVND } from "@/utils/currency";

interface BorrowedLent {
  id: string;
  name: string;
  amount: number;
  paidAmount?: number;
  startDate?: string;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string;
  type?: "borrowed" | "lent";
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

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [borrowedLent, setBorrowedLent] = useState<BorrowedLent | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBorrowedLentDetails() {
      try {
        // Fetch the borrowed/lent details
        const response = await fetch(`/api/borrowed-lent/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch borrowed/lent details");
        }
        const data = await response.json();
        setBorrowedLent({
          ...data,
          amount: parseFloat(data.amount),
          paidAmount: data.paidAmount ? parseFloat(data.paidAmount) : 0,
        });
        
        // Fetch related transactions
        const transactionsResponse = await fetch(`/api/borrowed-lent/${id}/transactions`);
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
      fetchBorrowedLentDetails();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error || !borrowedLent) {
    return <div className="container mx-auto p-4">Error: {error || "Borrowed/lent item not found"}</div>;
  }

  // Calculate remaining balance
  const remainingBalance = borrowedLent.amount - (borrowedLent.paidAmount || 0);
  // Calculate progress percentage
  const progressPercentage = Math.min(100, Math.round((borrowedLent.paidAmount || 0) / borrowedLent.amount * 100));

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

      <h1 className="text-2xl font-bold mb-2">{borrowedLent.name}</h1>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total Amount</p>
            <p className="text-xl font-semibold">{formatVND(borrowedLent.amount)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Paid Amount</p>
            <p className="text-xl font-semibold text-green-500">{formatVND(borrowedLent.paidAmount || 0)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Remaining</p>
            <p className="text-xl font-semibold text-red-500">{formatVND(remainingBalance)}</p>
          </div>
          {borrowedLent.startDate && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Start Date</p>
              <p>{formatDate(borrowedLent.startDate)}</p>
            </div>
          )}
          {borrowedLent.interestRate !== undefined && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Interest Rate</p>
              <p>{borrowedLent.interestRate}%</p>
            </div>
          )}
          {borrowedLent.minimumPayment !== undefined && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Minimum Payment</p>
              <p>{formatVND(borrowedLent.minimumPayment)}</p>
            </div>
          )}
          {borrowedLent.dueDate && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Due Date</p>
              <p>{formatDate(borrowedLent.dueDate)}</p>
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
        <p className="text-gray-500 dark:text-gray-400">No transactions found for this {borrowedLent.type || "item"}.</p>
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
                    transaction.category.type === "BORROWED" || transaction.category.type === "BORROWED_PAYMENT" ? 
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

      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => router.push(`/transactions/add?borrowedLentId=${id}`)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
        >
          Add New Transaction
        </button>
        
        {/* Borrowed Payment Buttons (only for borrowed money) */}
        {borrowedLent.type === "borrowed" && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => router.push(`/transactions/add?borrowedLentId=${id}&type=interest-payment`)}
              className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
            >
              Pay Interest
            </button>
            <button
              onClick={() => router.push(`/transactions/add?borrowedLentId=${id}&type=principal-payment`)}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
            >
              Pay Principal
            </button>
          </div>
        )}
        
        {/* Lent Collection Buttons (only for lent money) */}
        {borrowedLent.type === "lent" && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => router.push(`/transactions/add?borrowedLentId=${id}&type=interest-collection`)}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
            >
              Collect Interest
            </button>
            <button
              onClick={() => router.push(`/transactions/add?borrowedLentId=${id}&type=principal-collection`)}
              className="bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
            >
              Collect Principal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}