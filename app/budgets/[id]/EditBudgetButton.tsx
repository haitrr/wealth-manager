"use client";

import {Button} from "antd";
import {useRouter} from "next/navigation";

type Props = {
  id: string;
};

const EditBudgetButton = ({id}: Props) => {
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
