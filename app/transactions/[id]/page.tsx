"use client";
import { getTransaction } from "@/actions/transaction";
import { Money } from "@/app/Money";
import { formatDate } from "@/utils/date";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function TransactionDetailPage() {
  const transactionId = useParams().id;
  const [transaction, setTransaction] = 
    useState<Awaited<ReturnType<typeof getTransaction>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchTransaction() {
      try {
        setLoading(true);
        const data = await getTransaction(transactionId as string);
        setTransaction(data);
      } catch (err) {
        setError("Failed to load transaction details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTransaction();
  }, [transactionId]);

  const onEdit = () => {
    router.push(`/transactions/${transactionId}/edit`);
  };

  const onBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium">Loading transaction details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-red-500 font-medium">{error}</div>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-lg font-medium">Transaction not found</div>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
        >
          ← Back
        </button>
      </div>
      
      <div className="bg-secondary rounded-lg shadow-md p-6">
        <h1 className="text-xl font-bold mb-6 text-center">Transaction Details</h1>
        
        <div className="mb-8 text-center">
          <div className="text-sm text-gray-500 mb-1">Amount</div>
          <div className="text-3xl font-bold mb-2">
            <Money value={transaction.value} />
          </div>
          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            {transaction.category?.name || "Uncategorized"}
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Date</div>
              <div className="font-medium">{formatDate(transaction.date)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Transaction ID</div>
              <div className="font-medium text-sm truncate">{transaction.id}</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button 
            onClick={onEdit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit Transaction
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransactionDetailPage;
