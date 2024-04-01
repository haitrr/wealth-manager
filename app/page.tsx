import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)
export default function Home() {
  const transactions = [
    {id: 1, date: dayjs().subtract(1, 'day'), amount: 100000, category: {
      id: 1,
      name: 'Salary',
    }},
    {id: 1, date: dayjs().subtract(2, 'day'), amount: -2500, category: {
      id: 1,
      name: 'Food',
    }},
  ];
  const balance = 75000;
  return (
    <div>
    <div>Wealth Manager</div>
    <div>Balance</div>
    <div>{balance}</div>
    <div>Transactions</div>
    {transactions.map(transaction => (
      <div className="flex gap-4 p-4 border-2 border-red-50" key={transaction.id}>
        <div>{transaction.date.fromNow()}</div>
        <div>{transaction.amount}</div>
        <div>{transaction.category.name}</div>
      </div>
    ))}
    </div>
  );
}
