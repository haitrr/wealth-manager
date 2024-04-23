type Props = {
  startDate: Date;
  endDate: Date;
  value: number;
  spent: number;
};

export function BudgetProgress({startDate, endDate, value, spent}: Props) {
  const now = new Date();
  const totalDays =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const daysPassed =
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const budgetPerDay = value / totalDays;
  const percentPassed = (daysPassed / totalDays) * 100;
  const left = value - spent;
  const progress = Math.min(1, spent / value) * 100;
  const expectedLeft = value - budgetPerDay * daysPassed;
  console.log(left, expectedLeft, left - expectedLeft);
  const progressColor = expectedLeft > left ? "bg-red-500" : "bg-green-500";
  return (
    <div className="flex-1 h-2 relative bg-gray-800 rounded-full">
      <div
        className={`h-full ${progressColor} rounded-full`}
        style={{width: `${progress}%`}}
      />
      <div
        className="absolute"
        style={{left: `${percentPassed}%`, top: "-2px"}}
      >
        <div className="h-3 w-1 rounded bg-slate-500"></div>
        <div>Today</div>
      </div>
    </div>
  );
}
