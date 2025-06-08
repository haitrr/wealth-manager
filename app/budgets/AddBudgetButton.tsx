"use client";
import {useRouter} from "next/navigation";

export const AddBudgetButton = () => {
  const router = useRouter();
  const onClick = () => {
    // navigate to add transaction page
    router.push("/budgets/add");
  };
  return (
    <div className="fixed bottom-20 right-4">
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-12 h-12 rounded-full flex items-center justify-center text-xl"
        onClick={onClick}
      >
        +
      </button>
    </div>
  );
};
