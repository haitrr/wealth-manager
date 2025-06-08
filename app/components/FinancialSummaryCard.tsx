import { Money } from "../Money";

type Props = {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
};

export default function FinancialSummaryCard({ totalIncome, totalExpense, netIncome }: Props) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-100 mb-4">This Month Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-center">
          <div className="text-sm font-medium text-green-400 mb-1">Income</div>
          <div className="text-xl font-bold text-green-300">
            <Money value={totalIncome} />
          </div>
        </div>

        {/* Expense */}
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-center">
          <div className="text-sm font-medium text-red-400 mb-1">Expense</div>
          <div className="text-xl font-bold text-red-300">
            <Money value={-totalExpense} />
          </div>
        </div>

        {/* Net Income */}
        <div className={`border rounded-lg p-4 text-center ${
          netIncome >= 0 
            ? 'bg-blue-900/30 border-blue-800' 
            : 'bg-orange-900/30 border-orange-800'
        }`}>
          <div className={`text-sm font-medium mb-1 ${
            netIncome >= 0 ? 'text-blue-400' : 'text-orange-400'
          }`}>
            Net Income
          </div>
          <div className={`text-xl font-bold ${
            netIncome >= 0 ? 'text-blue-300' : 'text-orange-300'
          }`}>
            <Money value={netIncome} />
          </div>
        </div>
      </div>
    </div>
  );
}