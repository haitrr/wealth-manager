'use client'
import { useRouter } from "next/navigation";

export const AddTransactionButton = () => {
  const router = useRouter();
  const onClick = () => {
    // navigate to add transaction page
    router.push("/transaction/add");
  };
  return <div className="fixed bottom-20 right-4">
    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full" onClick={onClick}>
      +
    </button>
  </div>;
};
