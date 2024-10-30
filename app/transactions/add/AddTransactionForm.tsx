"use client";
import createTransaction from "@/server-actions/transaction";
import {TransactionForm} from "@/components/TransactionForm";

export const AddTransactionForm = () => {
  const handleSubmit = (transaction: any) => {
    createTransaction(transaction).then(() => {
      window.location.href = "/";
    });
  };

  return <TransactionForm onSubmit={handleSubmit}></TransactionForm>;
};
