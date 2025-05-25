"use client";
import {getTransaction} from "@/actions/transaction";
import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import EditTransactionForm from "./EditTransactionForm";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

// transaction edit page
const EditTransactionPage = () => {
  const transactionId = useParams().id;
  const [transaction, setTransaction] =
    useState<Awaited<ReturnType<typeof getTransaction>>>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const data = await getTransaction(transactionId as string);
        setTransaction(data);
      } catch (error) {
        console.error("Error fetching transaction:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransaction();
  }, [transactionId]);
  
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/transactions" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to transactions
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Transaction</h1>
        <p className="text-muted-foreground mt-2">Update the details of this transaction</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading transaction...</span>
        </div>
      ) : transaction ? (
        <div className="bg-card border rounded-lg shadow-sm p-6">
          <EditTransactionForm transaction={transaction} />
        </div>
      ) : (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mt-4">
          <p className="font-medium">Transaction not found</p>
          <p className="text-sm">The transaction could not be found or an error occurred. Please try again.</p>
        </div>
      )}
    </div>
  );
};

export default EditTransactionPage;
