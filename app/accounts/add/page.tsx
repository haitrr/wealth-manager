"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccountType } from "@prisma/client";
import Link from "next/link";

interface AccountFormData {
  name: string;
  type: AccountType;
  // Debt/Loan specific fields
  principalAmount?: number;
  interestRate?: number;
  startDate?: string;
  dueDate?: string;
}

export default function AddAccountPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<AccountFormData>({
    name: "",
    type: AccountType.CASH,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'principalAmount' || name === 'interestRate' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create account");
      }

      router.push("/accounts");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isDebtOrLoan = formData.type === AccountType.BORROWING || formData.type === AccountType.LOAN;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <Link 
          href="/accounts" 
          className="text-primary hover:text-primary/80 flex items-center gap-1 mb-4"
        >
          ← Back to Accounts
        </Link>
        <h1 className="text-2xl font-bold">Add New Account</h1>
      </div>

      <div className="bg-card border-border border rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Account Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter account name"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-foreground mb-2">
              Account Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={AccountType.CASH}>💰 Cash Account</option>
              <option value={AccountType.BORROWING}>📉 Borrowing (Debt)</option>
              <option value={AccountType.LOAN}>📈 Loan (You lend)</option>
            </select>
          </div>

          {isDebtOrLoan && (
            <>
              <div>
                <label htmlFor="principalAmount" className="block text-sm font-medium text-foreground mb-2">
                  Principal Amount (VND)
                </label>
                <input
                  type="number"
                  id="principalAmount"
                  name="principalAmount"
                  value={formData.principalAmount || ""}
                  onChange={handleInputChange}
                  required={isDebtOrLoan}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter principal amount"
                />
              </div>

              <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-foreground mb-2">
                  Interest Rate (% per year)
                </label>
                <input
                  type="number"
                  id="interestRate"
                  name="interestRate"
                  value={formData.interestRate || ""}
                  onChange={handleInputChange}
                  required={isDebtOrLoan}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter interest rate"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate || ""}
                    onChange={handleInputChange}
                    required={isDebtOrLoan}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-foreground mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate || ""}
                    onChange={handleInputChange}
                    required={isDebtOrLoan}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/accounts")}
              className="px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}