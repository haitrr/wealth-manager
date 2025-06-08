"use client";
import {updateTransaction} from "@/actions/transaction";
import {TransactionForm} from "@/components/TransactionForm";
import {useRouter} from "next/navigation";

type Props = {
  transaction: any;
};

const EditTransactionForm = ({transaction}: Props) => {
  const router = useRouter();
  const handleSubmit = async (data: any) => {
    await updateTransaction(transaction.id, data);
    router.push("/");
  };
  return (
    <div>
      <TransactionForm
        onSubmit={handleSubmit}
        defaultValues={{
          date: transaction.date,
          categoryId: transaction.categoryId,
          accountId: transaction.accountId,
          value: transaction.value,
        }}
      ></TransactionForm>
    </div>
  );
};

export default EditTransactionForm;
