"use client";
import {Controller, useForm} from "react-hook-form";
import {Select as AntdSelect} from "antd";
import CategoryTreeSelect from "@/components/CategoryTreeSelect";
import {createBudget} from "@/actions/budget";
import {useRouter} from "next/navigation";
import {CalendarIcon} from "lucide-react";
import {format} from "date-fns";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Calendar} from "@/components/ui/calendar";
import {Checkbox} from "@/components/ui/checkbox";

const AddBudgetPage = () => {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add Budget</h1>
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
    <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="block font-medium">
            Budget Name
          </Label>
          <Controller
            name="name"
            control={control}
            render={({field}) => (
              <Input
                id="name"
                {...field}
                placeholder="e.g., Monthly Groceries"
                className="w-full"
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categories" className="block font-medium">
            Categories
          </Label>
          <Controller
            name="categoryIds"
            control={control}
            render={({field}) => (
              <div className="rounded-md border border-input overflow-hidden">
                <CategoryTreeSelect {...field} className="w-full" />
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="value" className="block font-medium">
            Amount
          </Label>
          <Controller
            name="value"
            control={control}
            render={({field}) => (
              <Input
                id="value"
                type="number"
                {...field}
                className="w-full"
                placeholder="0.00"
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate" className="block font-medium">
            Start Date
          </Label>
          <Controller
            name="startDate"
            control={control}
            render={({field}) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(new Date(field.value), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="period" className="block font-medium">
            Period
          </Label>
          <Controller
            name="period"
            control={control}
            render={({field}) => (
              <div className="rounded-md border border-input overflow-hidden">
                <AntdSelect
                  {...field}
                  className="w-full"
                  options={[
                    {title: "Monthly", value: "MONTHLY"},
                    {title: "Weekly", value: "WEEKLY"},
                    {title: "Daily", value: "DAILY"},
                  ]}
                />
              </div>
            )}
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Controller
            name="repeat"
            control={control}
            render={({field}) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="repeat"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="repeat" className="font-medium cursor-pointer">
                  Repeat budget every period
                </Label>
              </div>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit">Create Budget</Button>
        </div>
      </form>
    </div>
  );
};

export default AddBudgetPage;
