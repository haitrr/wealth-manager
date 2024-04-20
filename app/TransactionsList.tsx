import dayjs from "dayjs";
import {formatVND, getColor} from "@/utils/currency";
import {Transaction} from "@/utils/types";

type Props = {
  transactions: Transaction[];
};

const formatDate = (date: dayjs.Dayjs) => {
  return date.format("MMM D YYYY");
};

const getDayOfWeek = (date: dayjs.Dayjs) => {
  if (formatDate(date) === formatDate(dayjs())) {
    return "Today";
  }
  if (formatDate(date) === formatDate(dayjs().subtract(1, "day"))) {
    return "Yesterday";
  }
  return date.format("dddd");
};

const TransactionsList = async ({transactions}: Props) => {
  const transactionsByDate: {[key: string]: Transaction[]} = {};
  transactions.forEach((tr) => {
    const date = dayjs(tr.date).format("MMM D YYYY");
    if (!transactionsByDate[date]) {
      transactionsByDate[date] = [];
    }
    transactionsByDate[date].push(tr);
  });
  console.log(transactions);
  console.log(transactionsByDate);

  return (
    <div>
      {Object.keys(transactionsByDate).map((date) => {
        const dateTransactions = transactionsByDate[date];
        const dayjsDate = dayjs(date);
        const day = dayjsDate.format("D");
        const dayOfWeek = getDayOfWeek(dayjsDate);
        const monthYear = dayjsDate.format("MMM YYYY");
        let netIncome = 0;
        dateTransactions.forEach((transaction) => {
          if (transaction.category.type === "INCOME") {
            netIncome += transaction.value;
          } else {
            netIncome -= transaction.value;
          }
        })
        return (
          <div key={date}>
            <div className="flex items-center justify-between p-2 bg-gray-800">
              <div className="flex gap-2">
                <span className="text-lg">{day}</span>
                <div className="text-xs">
                  <div>{dayOfWeek}</div>
                  <div>{monthYear}</div>
                </div>
              </div>
              <div className={`${getColor(netIncome)}`}>
                {formatVND(netIncome)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
  return (
    <div>
      {transactions.map((transaction) => (
        <div
          className={`flex gap-4 p-4 border-2 border-red-50 ${
            transaction.category.type === "INCOME"
              ? "text-green-300"
              : "text-red-300"
          }`}
          key={transaction.id}
        >
          <div>{dayjs(transaction.date).format("MMM D")}</div>
          <div>{formatVND(transaction.value)}</div>
          <div>{transaction.category.name}</div>
        </div>
      ))}
    </div>
  );
};

export default TransactionsList;
