"use client";
import {Controller, useForm} from "react-hook-form";
import {Button, Select, TreeSelect} from "antd";
import CategoryTreeSelect from "@/components/CategoryTreeSelect";
import {createBudget} from "@/actions/budget";
import {useRouter} from "next/navigation";

const AddBudgetPage = () => {
  return (
    <div>
      <h1>Add Budget</h1>
      <AddBudgetForm />
    </div>
  );
};

type Inputs = {
  name: string;
  categoryIds: string[];
  value: number;
  period: "MONTHLY" | "WEEKLY" | "DAILY";
  startDate: Date;
  repeat: boolean;
};

const AddBudgetForm = () => {
  const {control, handleSubmit} = useForm<Inputs>();
  const router = useRouter();
  const onSubmit = async (data: Inputs) => {
    await createBudget(data);
    router.push("/budgets");
  };
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>Name</label>
          <Controller
            name="name"
            control={control}
            render={({field}) => <input {...field} placeholder="Name" />}
          />
        </div>
        <div>
          <label>Categories</label>
          <Controller
            name="categoryIds"
            control={control}
            render={({field}) => <CategoryTreeSelect {...field} />}
          />
        </div>
        <div>
          <label>Amount</label>
          <Controller
            name="value"
            control={control}
            render={({field}) => <input {...field} type="number" />}
          />
        </div>
        <div>
          <label>Start date</label>
          <Controller
            name="startDate"
            control={control}
            render={({field}) => <input {...field} type="date" />}
          />
        </div>
        <div>
          <label>Period</label>
          <Controller
            name="period"
            control={control}
            render={({field}) => (
              <Select
                {...field}
                options={[{title: "Monthly", value: "MONTHLY"}]}
              />
            )}
          />
        </div>
        <div>
          <label>Repeat</label>
          <Controller
            name="repeat"
            control={control}
            render={({field}) => <input {...field} type="checkbox" />}
          />
        </div>
        <div>
          <Button type="primary" htmlType="submit">
            Add
          </Button>
        </div>
      </form>
    </div>
  );
};
export default AddBudgetPage;
