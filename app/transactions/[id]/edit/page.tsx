"use client";
import {getTransaction} from "@/actions/transaction";
import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import EditTransactionForm from "./EditTransactionForm";

// transaction edit page
const EditTransactionPage = () => {
  const transactionId = useParams().id;
  const [transaction, setTransaction] =
    useState<Awaited<ReturnType<typeof getTransaction>>>(null);
  useEffect(() => {
    getTransaction(transactionId as string).then((data) => {
      setTransaction(data);
    });
  }, [transactionId]);
  if (!transaction) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <h1>Edit Transaction</h1>
      <EditTransactionForm transaction={transaction}></EditTransactionForm>
    </div>
  );
};

export default EditTransactionPage;
