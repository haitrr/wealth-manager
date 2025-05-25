"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation"; // Added import
import {formatVND} from "@/utils/currency";

interface DebtLoan {
  id: string;
  name: string;
  amount: number; // Was already number, ensure parsing from string if API sends string
  paidAmount?: number; // Add paidAmount to calculate progress
  interestRate?: number; // Made optional
  minimumPayment?: number; // Made optional
  dueDate?: string; // Made optional
  type?: "debt" | "loan"; // Added type for differentiation
}

export default function DebtLoansPage() {
  const router = useRouter(); // Initialize router
  const [debtLoans, setDebtLoans] = useState<DebtLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDebtLoans() {
      try {
        const response = await fetch("/api/debt-loans");
        if (!response.ok) {
          throw new Error("Failed to fetch debt loans");
        }
        const data = await response.json();
        // Correctly process debts and loans from the API response
        const fetchedDebts = (data.debts || []).map((debt: any) => ({
          ...debt,
          amount: parseFloat(debt.amount), // Parse amount if it's a string
          // interestRate, minimumPayment, dueDate are not in the current Debt model
        }));
        const fetchedLoans = (data.loans || []).map((loan: any) => ({
          ...loan,
          amount: parseFloat(loan.amount), // Parse amount if it's a string
          // interestRate, minimumPayment, dueDate are not in the current Loan model
        }));
        setDebtLoans([...fetchedDebts, ...fetchedLoans]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDebtLoans();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 relative h-full">
      <h1 className="text-2xl font-bold mb-4">Debt Loans</h1>
      {debtLoans.length === 0 ? (
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
                onClick={() => router.push(`/debt-loan/${loan.id}`)}
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
      <button
        onClick={() => {
          router.push("/debt-loan/add"); // Navigate to /debt-loan/add
        }}
        className="absolute bottom-8 right-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-lg z-50"
        aria-label="Add Debt or Loan"
      >
        Add Debt/Loan
      </button>
    </div>
  );
}
