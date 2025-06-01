export type Transaction = {
    date: Date;
    id: string;
    value: number;
    category: Category;
}

export type Budget = {
    id: string;
    name: string;
    value: number;
    startDate: Date;
    categories: Partial<Category>[];
    period: BudgetPeriod;
}

export type BudgetPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"

export type CategoryType = "INCOME" | "EXPENSE" | "BORROWED" | "BORROWED_PAYMENT" 
    | "BORROWED_INTEREST_PAYMENT" | "BORROWED_FEE_PAYMENT" | "LENT" | "LENT_COLLECTION" 
    | "LENT_INTEREST_COLLECTION" | "BORROWED_COLLECTION_PAYMENT"

export type Category = {
    id: string;
    name: string;
    type: CategoryType;
    icon: string;
}
