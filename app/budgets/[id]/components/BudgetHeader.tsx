import { Money } from "@/app/Money";
import dayjs from "dayjs";
import { getBudgetEndDate } from "@/utils/date";
import { Budget } from "@/utils/types";
import { BudgetProgress } from "../../BudgetProgress";

type Props = {
  budget: Budget;
  spent: number;
  left: number;
};

export default function BudgetHeader({ budget, spent, left }: Props) {
  const startDate = budget.startDate;
  const endDate = getBudgetEndDate(budget);
  const dayLeft = dayjs(endDate).diff(dayjs(), "day");

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 mb-6">
      {/* Budget Title and Total */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">{budget.name}</h1>
        <div className="text-3xl font-bold text-blue-400">
          <Money value={budget.value} />
        </div>
      </div>

      {/* Spent and Left Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-center">
          <div className="text-sm font-medium text-red-400 mb-1">Spent</div>
          <div className="text-xl font-bold text-red-300">
            <Money value={spent} />
          </div>
        </div>
        <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-center">
          <div className="text-sm font-medium text-green-400 mb-1">Left</div>
          <div className="text-xl font-bold text-green-300">
            <Money value={left} />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <BudgetProgress budget={budget} />
      </div>

      {/* Date Range and Days Left */}
      <div className="flex justify-between items-center text-sm text-gray-400">
        <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2">
          {`${dayjs(startDate).format("DD/MM")} - ${dayjs(endDate).format("DD/MM")}`}
        </div>
        <div className="bg-blue-900/30 border border-blue-800 rounded-lg px-3 py-2 text-blue-400 font-medium">
          {`${dayLeft} days left`}
        </div>
      </div>
    </div>
  );
}