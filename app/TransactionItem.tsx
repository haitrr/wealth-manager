"use client";
import {Transaction} from "@/utils/types";
import {CategoryIcon} from "./CategoryIcon";
import {Money} from "./Money";
import Link from "next/link";

type Props = {
  transaction: Transaction;
};

export function TransactionItem({transaction}: Props) {
  return (
    <Link href={`/transactions/${transaction.id}`}>
      <div className="flex justify-between border-gray-700 border-b text-lg p-2 ml-4 items-center">
        <div className="flex gap-1 items-center">
          <CategoryIcon />
          <div>{transaction.category.name}</div>
        </div>
        <Money
          value={transaction.value}
          categoryType={transaction.category.type}
        />
      </div>
    </Link>
  );
}
