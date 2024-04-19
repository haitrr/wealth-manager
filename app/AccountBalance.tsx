import { formatVND } from "@/utils/currency";
import prisma from "../lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

const AccountBalance = async () => {
  const [{ balance }] = (await prisma.$queryRaw`SELECT 
  (SELECT COALESCE(SUM(value), 0) FROM "Transaction" WHERE "categoryId" IN (SELECT id FROM "Category" WHERE "type" = 'INCOME')) - 
  (SELECT COALESCE(SUM(value), 0) FROM "Transaction" WHERE "categoryId" IN (SELECT id FROM "Category" WHERE "type" = 'EXPENSE')) AS balance;
`) as { balance: Decimal; }[];

  const color = balance.toNumber() >= 0 ? "text-green-500" : "text-red-500";

  return <div className={color}>{formatVND(balance.toNumber())}</div>;
};

export default AccountBalance;