"use client";
import CategorySelect from "@/app/CategorySelect";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {DatePicker} from "@/components/ui/datepicker";
import {Label} from "@/components/ui/label";
import {getCategories} from "@/actions/category";
import dayjs from "dayjs";
import createTransaction from "@/server-actions/transaction";
import {useEffect, useState} from "react";

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

export const AddTransactionForm = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories().then((data) => {
      setCategories(data);
    });
  }, []);

  const handleCancel = () => {
    window.history.back();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const date = formData.get("date") as string;
    const value = formData.get("value") as string;
    const categoryId = formData.get("categoryId") as string;
    const transaction = {
      date: dayjs(date).toDate(),
      value: parseFloat(value),
      categoryId,
    };
    createTransaction(transaction).then(() => {
      window.location.href = "/";
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FieldContainer>
        <Label className="w-24">Date</Label>
        <DatePicker name="date" />
      </FieldContainer>
      <FieldContainer>
        <Label className="w-24">Amount</Label>
        <Input type="number" name="value" className="w-50" required />
      </FieldContainer>
      <FieldContainer className="flex items-center">
        <Label className="w-24">Category</Label>
        <CategorySelect
          name="categoryId"
          className="w-50"
          categories={categories}
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
