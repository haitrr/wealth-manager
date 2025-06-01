"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {formatVND} from "@/utils/currency";

interface Loan {
  id: string;
  name: string;
  amount: number;
  paidAmount?: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string;
  type?: "debt" | "loan";
}

interface PaginationInfo {
  limit: number;
  offset: number;
  totalDebts: number;
  totalLoans: number;
}

export default function LoansPage() {
  const router = useRouter();
  const [debtLoans, setDebtLoans] = useState<Loan[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Optimized data fetching with memoization
  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchAccounts() {
      try {
        setLoading(true);
        // Add sort by startDate for using the index we created
        const response = await fetch("/api/accounts?limit=20&sortBy=startDate&sortDirection=desc", {
          signal: controller.signal,
          // Using next.js cache settings for better performance
          next: { revalidate: 60 } // Revalidate data every 60 seconds
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch debt loans");
        }
        
        const data = await response.json();
        
        // Process data with a single iteration to improve performance
        const processedItems: Loan[] = [];
        
        // Process debts
        if (Array.isArray(data.debts)) {
          for (const debt of data.debts) {
            processedItems.push({
              ...debt,
              amount: typeof debt.amount === 'string' ? parseFloat(debt.amount) : Number(debt.amount),
              paidAmount: typeof debt.paidAmount === 'string' ? parseFloat(debt.paidAmount || '0') : Number(debt.paidAmount || 0),
              type: 'debt'
            });
          }
        }
        
        // Process loans
        if (Array.isArray(data.loans)) {
          for (const loan of data.loans) {
            processedItems.push({
              ...loan,
              amount: typeof loan.amount === 'string' ? parseFloat(loan.amount) : Number(loan.amount),
              paidAmount: typeof loan.paidAmount === 'string' ? parseFloat(loan.paidAmount || '0') : Number(loan.paidAmount || 0),
              type: 'loan'
            });
          }
        }
        
        setDebtLoans(processedItems);
        setPagination(data.pagination);
      } catch (err: any) {
        // Only set error if not due to component unmount
        if (err.name !== 'AbortError') {
          setError(err.message);
          console.error("Error fetching debt loans:", err);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchAccounts();
    
    // Cleanup function to abort fetch on unmount
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="container mx-auto p-4 relative h-full">
      <h1 className="text-2xl font-bold mb-4">Accounts</h1>
      
      {loading ? (
        // Skeleton loading UI
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg shadow-sm animate-pulse">
              <div className="flex justify-between items-center mb-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="flex justify-between mb-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : debtLoans.length === 0 ? (
        <p>No debt loans found.</p>
      ) : (
        <ul className="space-y-4">
          {debtLoans.map((loan) => {
            // Calculate progress percentage
            const paidAmount = loan.paidAmount || 0;
            const progressPercentage = Math.min(
              100,
              Math.round((paidAmount / loan.amount) * 100),
            );
            const remainingAmount = loan.amount - paidAmount;

            return (
              <li
                key={loan.id}
                className="p-4 border rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => router.push(`/loan/${loan.id}`)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">{loan.name}</h2>
                  <span className="text-sm bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5">
                    {loan.type === "debt" ? "Debt" : "Loan"}
                  </span>
                </div>

                <div className="flex justify-between mb-1 text-sm">
                  <span>Total: {formatVND(loan.amount)}</span>
                  <span>{progressPercentage}% paid</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5 mb-3">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{width: `${progressPercentage}%`}}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Paid:{" "}
                    </span>
                    <span className="text-green-500">
                      {formatVND(paidAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Remaining:{" "}
                    </span>
                    <span className="text-red-500">
                      {formatVND(remainingAmount)}
                    </span>
                  </div>

                  {/* Conditionally render optional fields */}
                  {loan.interestRate !== undefined && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Interest:{" "}
                      </span>
                      <span>{loan.interestRate}%</span>
                    </div>
                  )}
                  {loan.minimumPayment !== undefined && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Min Payment:{" "}
                      </span>
                      <span>{formatVND(loan.minimumPayment)}</span>
                    </div>
                  )}
                  {loan.dueDate && (
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        Due Date:{" "}
                      </span>
                      <span>{new Date(loan.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      
      {/* Fixed action button */}
      <button
        onClick={() => {
          router.push("/loans/add");
        }}
        className="fixed bottom-24 right-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full shadow-lg z-50"
        aria-label="Add Debt or Loan"
      >
        + Add
      </button>
    </div>
  );
}
