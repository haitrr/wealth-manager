export type Transaction = {
    date: Date;
    id: string;
    value: number;
    category: Category;
}

export type CategoryType = "INCOME" | "EXPENSE" | "DEBT" | "LOAN"
    | "DEBT_COLLECTION"
    | "LOAN_PAYMENT"

export type Category = {
    id?: string;
    name: string;
    type: CategoryType;
}
