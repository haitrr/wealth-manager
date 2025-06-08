import prisma from "@/lib/prisma";
import BudgetEditForm from "./components/BudgetEditForm";
import { Category } from "@prisma/client";

type Props = {
  params: { id: string };
};

export default async function BudgetEditPage({ params }: Props) {
  const { id } = params;
  
  // Fetch budget data
  const budgetP = await prisma.budget.findUnique({
    where: { id },
    include: { categories: { select: { id: true, name: true, type: true } } },
  });

  if (!budgetP) {
    return (
      <div className="min-h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-4">Budget Not Found</h1>
          <p className="text-gray-400">{"The budget you're looking for doesn't exist."}</p>
        </div>
      </div>
    );
  }

  const budget = {
    ...budgetP,
    value: budgetP.value.toNumber(),
    repeat: budgetP.repeat || false,
  };

  // Fetch all categories for selection
  const categories: Pick<Category, "id" | "parentId" | "name" | "type">[] = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      parentId: true,
    },
    orderBy: [
      { parentId: "asc" },
      { name: "asc" },
    ],
  });

  return <BudgetEditForm budget={budget} categories={categories} />;
}
