import dayjs from "dayjs";
import {Transaction} from "@/utils/types";
import {getDayOfWeek} from "@/utils/date";
import {TransactionItem} from "./TransactionItem";
import {Money} from "./Money";

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
    <div className="w-full flex flex-col gap-4">
      {Object.keys(transactionsByDate).map((date) => {
        const dateTransactions = transactionsByDate[date];
        const dayjsDate = dayjs(date);
        const day = dayjsDate.format("D");
        const dayOfWeek = getDayOfWeek(dayjsDate);
        const monthYear = dayjsDate.format("MMM YYYY");
        let netIncome = 0;
        dateTransactions.forEach((transaction) => {
          if (
            transaction.category.type === "INCOME" ||
            transaction.category.type === "LOAN" ||
            transaction.category.type === "DEBT_COLLECTION"
          ) {
            netIncome += transaction.value;
          } else {
            netIncome -= transaction.value;
          }
        });
        return (
          <div key={date} className=" w-full">
            <div className="flex items-center justify-between p-2 text-xl">
              <div className="flex gap-2 items-center">
                <span className="text-xl">{day}</span>
                <div className="text-sm">
                  <div>{dayOfWeek}</div>
                  <div>{monthYear}</div>
                </div>
              </div>
              <Money value={netIncome} />
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
