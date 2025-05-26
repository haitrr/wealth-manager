import {AddTransactionForm} from "./AddTransactionForm";
import Link from "next/link";

const AddTransactionPage = async () => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Link 
          href="/" 
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-2"
        >
          ← Back to Transactions
        </Link>
        <h1 className="text-3xl font-bold text-primary">Add New Transaction</h1>
        <p className="text-gray-600 mt-2">Record a new financial transaction</p>
      </div>
      
      <div className="bg-secondary rounded-lg shadow-sm border border-gray-200 p-6">
        <AddTransactionForm />
      </div>
    </div>
  );
};

export default AddTransactionPage;
