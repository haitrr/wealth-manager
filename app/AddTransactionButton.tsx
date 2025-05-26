"use client";
import {useRouter} from "next/navigation";

export const AddTransactionButton = () => {
  const router = useRouter();
  const onClick = () => {
    // navigate to add transaction page
    router.push("/transactions/add");
  };
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <button
        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center justify-center"
        onClick={onClick}
        aria-label="Add new transaction"
        title="Add new transaction"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 4v16m8-8H4" 
          />
        </svg>
      </button>
    </div>
  );
};
