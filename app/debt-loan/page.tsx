"use client";

import {useEffect, useState} from "react";

interface DebtLoan {
  id: string;
  name: string;
  amount: number; // Was already number, ensure parsing from string if API sends string
  interestRate?: number; // Made optional
  minimumPayment?: number; // Made optional
  dueDate?: string; // Made optional
  // Consider adding 'type: "debt" | "loan"' if differentiation is needed
}

export default function DebtLoansPage() {
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
          {debtLoans.map((loan) => (
            <li key={loan.id} className="p-4 border rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold">{loan.name}</h2>
              <p>Amount: ${loan.amount.toFixed(2)}</p>
              {/* Conditionally render optional fields */}
              {loan.interestRate !== undefined && (
                <p>Interest Rate: {loan.interestRate}%</p>
              )}
              {loan.minimumPayment !== undefined && (
                <p>Minimum Payment: ${loan.minimumPayment.toFixed(2)}</p>
              )}
              {loan.dueDate && (
                <p>Due Date: {new Date(loan.dueDate).toLocaleDateString()}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={() => {
          // Placeholder for navigation or modal opening
          console.log("Add Debt/Loan button clicked");
        }}
        className="absolute bottom-8 right-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-lg z-50"
        aria-label="Add Debt or Loan"
      >
        Add Debt/Loan
      </button>
    </div>
  );
}
