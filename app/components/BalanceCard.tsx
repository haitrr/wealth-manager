import AccountBalance from "../AccountBalance";

export default function BalanceCard() {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 mb-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Total Balance</h1>
        <div className="text-3xl font-bold text-blue-400">
          <AccountBalance />
        </div>
      </div>
    </div>
  );
}