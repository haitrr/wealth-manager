import { formatVND } from "@/utils/currency";
import prisma from "../lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

const AccountBalance = async () => {
  const [{ balance }] = (await prisma.$queryRaw`SELECT 
  (SELECT COALESCE(SUM(value), 0) FROM "Transaction" WHERE "categoryId" IN (SELECT id FROM "Category" WHERE "type" = 'INCOME')) - 
  (SELECT COALESCE(SUM(value), 0) FROM "Transaction" WHERE "categoryId" IN (SELECT id FROM "Category" WHERE "type" = 'EXPENSE')) AS balance;
`) as { balance: Decimal; }[];

  return <div>{formatVND(balance.toNumber())}</div>;
};

export default AccountBalance;