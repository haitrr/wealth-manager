"use client";
import CategorySelect from "@/app/CategorySelect";
import AccountSelect from "@/app/AccountSelect";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {DatePicker} from "@/components/ui/datepicker";
import {Label} from "@/components/ui/label";
import {useEffect, useMemo, useState} from "react";
import {useForm, Controller} from "react-hook-form";
import {api} from "@/utils/api";
import {Account, Category} from "@prisma/client";

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
  accountId: string;
  borrowedId?: string;
  lentId?: string;
};

export const TransactionForm = ({onSubmit, defaultValues}: Props) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Set default date to today if not provided
  const formDefaultValues = {
    ...defaultValues,
    date: defaultValues?.date || new Date()
  };
  
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: {errors},
    setValue,
  } = useForm<Inputs>({defaultValues: formDefaultValues});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await api.categories.getAll();
        setCategories(categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const accounts = await api.accounts.getAll();
        setAccounts(accounts);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };

    fetchAccounts();
  }, [setAccounts])

  const currentValues = watch();
  const isAccountFieldRegistered = useMemo(() => Object.keys(currentValues).includes("accountId"), [currentValues]);
  useEffect(() => {
        // Set default account if not already set and no default value provided
        if (!defaultValues?.accountId && isAccountFieldRegistered) {
          const defaultAccount = accounts.find((account) => account.default);
          if (defaultAccount) {
            // Use setTimeout to ensure form is fully initialized
            setTimeout(() => {
              setValue('accountId', defaultAccount.id);
            }, 0);
          }
        }

  }, [setValue, defaultValues?.accountId, isAccountFieldRegistered, accounts]);

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
        <Controller
          name="value"
          control={control}
          render={({field: {value, onChange}}) => {
            const formatNumber = (num: number) => {
              return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            };

            const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const rawValue = e.target.value.replace(/\./g, "");
              const numericValue = parseFloat(rawValue) || 0;
              onChange(numericValue);
            };

            return (
              <Input
                className="w-50"
                required
                value={value ? formatNumber(value) : ""}
                onChange={handleInputChange}
                placeholder="0"
              />
            );
          }}
        />
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
      <FieldContainer className="flex items-center">
        <Label className="w-24">Account</Label>
        <Controller
          name="accountId"
          control={control}
          render={({field}) => {
            return (
              <AccountSelect
                className="w-50"
                accounts={accounts}
                {...field}
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
