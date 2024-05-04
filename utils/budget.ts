import { getAllCategories } from "./category";

export async function getAllBudgetCategoriesIds(budget: any) {
    const categories = await getAllCategories(false);
    const budgetCategories = categories.filter((category: any) =>
        budget.categories.some((budgetCategory: any) => budgetCategory.id === category.id)
    );
    const getChildCategories = (category: any): any[] => {
        const rs = []
        for (let child of category.children ?? []) {
            rs.push(child);
            const grandChildren = getChildCategories(child);
            rs.push(...grandChildren);
        }
        return rs
    }
    for (let category of budgetCategories) {
        const children = getChildCategories(category);
        budgetCategories.push(...children);
    }
    return budgetCategories.map((category) => category.id);
}
