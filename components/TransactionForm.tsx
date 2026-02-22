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
import {Account, Category, AccountType, CategoryType} from "@prisma/client";
import {BORROWING_TRANSACTION_TYPES, LOAN_TRANSACTION_TYPES} from "@/lib/utils";

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
  counterparty?: string;
  description?: string;
};

type AccountWithDebt = Account & {
  debt?: {
    name: string;
    counterparty: string | null;
    principalAmount: number;
    interestRate: number;
    startDate: Date;
    dueDate: Date;
    direction: string;
  } | null;
};

const DEBT_PAYMENT_CATEGORY_TYPES: CategoryType[] = [
  CategoryType.BORROWING_PAYMENT,
  CategoryType.BORROWING_INTEREST_PAYMENT,
  CategoryType.LOAN_COLLECTION,
  CategoryType.LOAN_INTEREST_COLLECTION,
];

function getAutoDescription(categoryType: CategoryType, accountName: string, counterparty: string | null): string {
  switch (categoryType) {
    case CategoryType.BORROWING_PAYMENT:
      return `Debt payment for ${accountName}`;
    case CategoryType.BORROWING_INTEREST_PAYMENT:
      return `Interest payment for ${accountName}`;
    case CategoryType.LOAN_COLLECTION:
      return `Loan collection from ${counterparty || accountName}`;
    case CategoryType.LOAN_INTEREST_COLLECTION:
      return `Loan interest collection from ${counterparty || accountName}`;
    default:
      return "";
  }
}

export const TransactionForm = ({onSubmit, defaultValues}: Props) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<AccountWithDebt[]>([]);

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
        setAccounts(accounts as AccountWithDebt[]);
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

  // Derive selected category and whether it's a debt payment category
  const selectedCategoryId = currentValues.categoryId;
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );
  const isDebtPaymentCategory = selectedCategory
    ? DEBT_PAYMENT_CATEGORY_TYPES.includes(selectedCategory.type)
    : false;

  // Filter accounts shown based on selected category type
  const filteredAccounts = useMemo(() => {
    if (!selectedCategory) return accounts;
    if ((BORROWING_TRANSACTION_TYPES as CategoryType[]).includes(selectedCategory.type) &&
        selectedCategory.type !== CategoryType.BORROWING) {
      return accounts.filter((a) => a.type === AccountType.BORROWING);
    }
    if ((LOAN_TRANSACTION_TYPES as CategoryType[]).includes(selectedCategory.type) &&
        selectedCategory.type !== CategoryType.LOAN) {
      return accounts.filter((a) => a.type === AccountType.LOAN);
    }
    return accounts;
  }, [accounts, selectedCategory]);

  // Auto-fill when debt account is selected and category is a debt payment type
  const selectedAccountId = currentValues.accountId;
  useEffect(() => {
    if (!isDebtPaymentCategory || !selectedAccountId || !selectedCategory) return;

    const account = accounts.find((a) => a.id === selectedAccountId);
    if (!account || !account.debt) return;

    // Auto-fill counterparty
    setValue("counterparty", account.debt.counterparty || "");

    // Auto-fill description
    const autoDesc = getAutoDescription(selectedCategory.type, account.name, account.debt.counterparty);
    setValue("description", autoDesc);

    // Auto-fill amount from remaining debt
    api.accounts.getRemaining(selectedAccountId)
      .then(({ remainingAmount }) => {
        setValue("value", remainingAmount);
      })
      .catch((err) => console.error("Error fetching remaining amount:", err));
  }, [isDebtPaymentCategory, selectedAccountId, selectedCategory, accounts, setValue]);

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
                accounts={filteredAccounts}
                {...field}
              />
            );
          }}
        />
      </FieldContainer>
      {isDebtPaymentCategory && (
        <>
          <FieldContainer>
            <Label className="w-24">Counterparty</Label>
            <Controller
              name="counterparty"
              control={control}
              render={({field: {value, onChange}}) => (
                <Input
                  className="w-50"
                  value={value || ""}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="Counterparty name"
                />
              )}
            />
          </FieldContainer>
          <FieldContainer>
            <Label className="w-24">Description</Label>
            <Controller
              name="description"
              control={control}
              render={({field: {value, onChange}}) => (
                <Input
                  className="w-50"
                  value={value || ""}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="Payment description"
                />
              )}
            />
          </FieldContainer>
        </>
      )}
      <FieldContainer>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit">Submit</Button>
      </FieldContainer>
    </form>
  );
};
