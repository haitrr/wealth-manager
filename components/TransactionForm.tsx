"use client";
import CategorySelect from "@/app/CategorySelect";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {DatePicker} from "@/components/ui/datepicker";
import {Label} from "@/components/ui/label";
import {getCategories} from "@/actions/category";
import {useEffect, useState} from "react";
import {useForm, Controller} from "react-hook-form";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

const FieldContainer = ({children, className}: ContainerProps) => {
  return (
    <div className={`mb-4 flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
};

type Props = {
  onSubmit: (data: Inputs) => void;
  defaultValues?: Inputs;
};

type Inputs = {
  date: Date;
  value: number;
  categoryId: string;
  borrowedId?: string;
  lentId?: string;
};

export const TransactionForm = ({onSubmit, defaultValues}: Props) => {
  const [categories, setCategories] = useState<any>([]);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: {errors},
  } = useForm<Inputs>({defaultValues: defaultValues});

  useEffect(() => {
    getCategories().then((data) => {
      setCategories(data);
    });
  }, []);

  const handleCancel = () => {
    window.history.back();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldContainer>
        <Label className="w-24">Date</Label>
        <Controller
          control={control}
          name="date"
          render={({field: {value, onChange}}) => {
            return <DatePicker value={value} onChange={onChange} />;
          }}
        ></Controller>
      </FieldContainer>
      <FieldContainer>
        <Label className="w-24">Amount</Label>
        <Input className="w-50" required {...register("value")} />
      </FieldContainer>
      <FieldContainer className="flex items-center">
        <Label className="w-24">Category</Label>
        <Controller
          name="categoryId"
          control={control}
          render={({field: {value, onChange}}) => {
            return (
              <CategorySelect
                className="w-50"
                categories={categories}
                value={value}
                onChange={onChange}
              />
            );
          }}
        />
      </FieldContainer>
      <FieldContainer>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit">Submit</Button>
      </FieldContainer>
    </form>
  );
};
