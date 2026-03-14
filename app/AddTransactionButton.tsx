"use client";
import { useState } from "react";
import { AddTransactionForm } from "./transactions/add/AddTransactionForm";

export const AddTransactionButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-20 right-4 z-50">
        <button
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center justify-center"
          onClick={() => setOpen(true)}
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

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-gray-800 w-full sm:max-w-lg sm:rounded-xl rounded-t-xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Add New Transaction</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-100 transition-colors p-1 rounded"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <AddTransactionForm onClose={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
