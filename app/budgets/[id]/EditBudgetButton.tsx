"use client";

import {Button} from "antd";
import {useRouter} from "next/navigation";

const EditBudgetButton = ({id}) => {
  const router = useRouter();
  return (
    <Button
      onClick={() => {
        router.push(`/budgets/${id}/edit`);
      }}
    >
      Edit
    </Button>
  );
};

export default EditBudgetButton;
