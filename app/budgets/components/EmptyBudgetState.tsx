export function EmptyBudgetState() {
  return (
    <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700/50">
      <div className="text-gray-500 text-6xl mb-6">💰</div>
      <h3 className="text-xl font-semibold text-gray-300 mb-3">No budgets yet</h3>
      <p className="text-gray-400">Create your first budget to get started</p>
    </div>
  );
}