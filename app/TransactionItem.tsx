"use client";
import {Transaction} from "@/utils/types";
import {CategoryIcon} from "./CategoryIcon";
import {Money} from "./Money";
import Link from "next/link";

// Helper function to format date
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

type Props = {
  transaction: Transaction;
};

export function TransactionItem({transaction}: Props) {
  return (
    <Link href={`/transactions/${transaction.id}`} className="block">
      <div className="flex justify-between border-gray-700 border-b p-4 hover:bg-secondary transition-colors">
        <div className="flex gap-4 items-center">
          <div className="bg-gray-100 rounded-full p-2.5 flex items-center justify-center">
            <CategoryIcon icon={transaction.category.icon} />
          </div>
          <div>
            <div className="font-medium">{transaction.category.name}</div>
          </div>
        </div>
        <div className="flex flex-col items-end justify-center">
          <Money
            value={transaction.value}
            categoryType={transaction.category.type}
            className="font-semibold"
          />
        </div>
      </div>
    </Link>
  );
}
