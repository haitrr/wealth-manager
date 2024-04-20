import { formatVND } from "@/utils/currency";
import prisma from "../lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { Money } from "./Money";

const AccountBalance = async () => {
  const [{ balance }] = (await prisma.$queryRaw`SELECT 
  (SELECT COALESCE(SUM(value), 0) FROM "Transaction" WHERE "categoryId" IN (SELECT id FROM "Category" WHERE "type" = 'INCOME')) - 
  (SELECT COALESCE(SUM(value), 0) FROM "Transaction" WHERE "categoryId" IN (SELECT id FROM "Category" WHERE "type" = 'EXPENSE')) AS balance;
`) as { balance: Decimal; }[];

  return <Money value={balance.toNumber()} className="text-xl" />;
};

export default AccountBalance;