"use client";
import createTransaction from "@/server-actions/transaction";
import CategorySelect from "./CategorySelect";
import dayjs from "dayjs";
import { Category } from "@/utils/types";

import {useRouter} from "next/navigation"


type Props = {
  categories: Category[];
}

const TransactionForm = ({categories}: Props) => {
  const router = useRouter();
  const handleSubmit = async (event: any) => {
    console.log("event", event);
    event.preventDefault();
    const formData = new FormData(event.target);
    const transaction = Object.fromEntries(formData) as any;
    transaction.date = dayjs(transaction.date).toISOString();
    const newTransaction = await createTransaction(transaction);
    router.refresh()
    event.target.reset();
    console.log("created transaction", newTransaction);
  };

  return (
    <form className="flex flex-col max-w-24" onSubmit={handleSubmit}>
      <label>Date</label>
      <input className="text-slate-950" type="date" name="date" required/>
      <label>Value</label>
      <input type="number" name="value" className="text-slate-950" required/>
      <label>Category</label>
      <CategorySelect name="categoryId" categories={categories}/>
      <button>Submit</button>
    </form>
  );
};

export default TransactionForm;
