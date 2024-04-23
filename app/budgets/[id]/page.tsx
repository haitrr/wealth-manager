import prisma from "@/lib/prisma";

export default async function BudgetDetailPage({params}) {
  const {id} = params;
  const budget = await prisma.budget.findUnique({
    where: {id},
    include: {categories: {select: {id: true}}},
  });
  if (!budget) {
    return <div>Not found</div>;
  }
  return (
    <div>
      <div className="flex justify-center text-lg items-center">
        <div>{budget.name}</div>
      </div>
    </div>
  );
}
