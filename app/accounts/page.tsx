"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {formatVND} from "@/utils/currency";
import {Account, AccountType} from "@prisma/client";
import AccountItem from "./AccountItem";

interface PaginationInfo {
  limit: number;
  offset: number;
  totalDebts: number;
  totalLoans: number;
}

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
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
        const response = await fetch("/api/accounts?limit=20", {
          signal: controller.signal,
          // Using next.js cache settings for better performance
          next: { revalidate: 60 } // Revalidate data every 60 seconds
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch debt loans");
        }
        
        const data = await response.json();
        setAccounts(data.accounts || []);
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
      ) : accounts.length === 0 ? (
        <p>No debt loans found.</p>
      ) : (
        <ul className="space-y-4">
          {accounts.map((loan) => (
            <AccountItem 
              key={loan.id} 
              account={loan} 
              onClick={(id) => router.push(`/loan/${id}`)} 
            />
          ))}
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
