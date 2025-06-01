import prisma from "../lib/prisma";
import {Decimal} from "@prisma/client/runtime/library";
import {Money} from "./Money";
import { EXPENSE_CATEGORY_TYPES, INCOME_CATEGORY_TYPES } from "@/lib/utils";

const AccountBalance = async () => {
  // Get income transactions
  const incomeTransactions = await prisma.transaction.aggregate({
    _sum: {
      value: true,
    },
    where: {
      category: {
        type: {
          in: INCOME_CATEGORY_TYPES
        }
      }
    }
  });

  // Get expense transactions
  const expenseTransactions = await prisma.transaction.aggregate({
    _sum: {
      value: true,
    },
    where: {
      category: {
        type: {
          in: EXPENSE_CATEGORY_TYPES
        }
      }
    }
  });

  const income = incomeTransactions._sum.value || new Decimal(0);
  const expenses = expenseTransactions._sum.value || new Decimal(0);
  const balance = income.sub(expenses);

  return <Money value={balance.toNumber()} className="text-xl" />;
};

export default AccountBalance;
