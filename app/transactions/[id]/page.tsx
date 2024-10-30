"use client";
import {getTransaction} from "@/actions/transaction";
import {Money} from "@/app/Money";
import {formatDate} from "@/utils/date";
import {useParams, useRouter} from "next/navigation";
import {useEffect, useState} from "react";

function TransactionDetailPage() {
  const transactionId = useParams().id;
  const [transaction, setTransaction] =
    useState<Awaited<ReturnType<typeof getTransaction>>>(null);
  useEffect(() => {
    getTransaction(transactionId as string).then((data) => {
      setTransaction(data);
    });
  }, [transactionId]);
  const router = useRouter();

  const onEdit = () => {
    router.push(`/transactions/${transactionId}/edit`);
  };

  if (!transaction) return <div>Loading...</div>;

  return (
    <div className="flex items-center flex-col">
      <div>{transaction.category!.name}</div>
      <Money value={transaction.value} />
      <div>{formatDate(transaction.date)}</div>
      <button onClick={onEdit}>Edit</button>
    </div>
  );
}

export default TransactionDetailPage;
