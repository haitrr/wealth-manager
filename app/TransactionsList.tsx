import dayjs from "dayjs";
import {formatVND, getColor} from "@/utils/currency";
import {Transaction} from "@/utils/types";
import {getDayOfWeek} from "@/utils/date";
import { TransactionItem } from "./TransactionItem";

type Props = {
  transactions: Transaction[];
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
        });
        return (
          <div key={date} className="bg-gray-800">
            <div className="flex items-center justify-between p-2">
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
            {dateTransactions.map((transaction) => {
              return (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default TransactionsList;
