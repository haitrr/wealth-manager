// import transactions from Money Lover to Wealth Manager

import prisma from "../../lib/prisma";
import fs from "fs";
import csvParse from "csv-parse";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { CategoryType } from "@prisma/client";
dayjs.extend(customParseFormat);


export const importTransactions = async () => {
  try {
    // Reset db
    await prisma.transaction.deleteMany();
    await prisma.category.deleteMany();
  
    console.log("Importing transactions");
    const transactionData: any[] = [];
    const categoryMap = new Map();

    // Read ML transactions from csv ml.csv
    fs.createReadStream("./scripts/import/ml.csv")
      .pipe(csvParse.parse({ delimiter: ",", from_line: 2 }))
      .on("data", async function (row) {
        const categoryName = row[2];
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
              name: categoryName,
              type: row[3][0] === "-" ? CategoryType.EXPENSE : CategoryType.INCOME
          });
        }

        transactionData.push({
          date: dayjs(row[1], "DD/MM/YYYY").toDate(),
          value: Math.abs(parseFloat(row[3].replace(/,/g, ""))),
          categoryName: categoryName,
        });
      })
      .on("end", async function () {
        console.log(`Creating ${categoryMap.size} category`);
        await prisma.category.createMany({
          data: Array.from(categoryMap.values()),
        });
        const categories = await prisma.category.findMany();
        categoryMap.clear();
        categories.forEach((category) => {
          categoryMap.set(category.name, category);
        });
        transactionData.forEach((transaction, index) => {
          transaction.categoryId = categoryMap.get(transaction.categoryName).id;
          transaction.categoryName = undefined;
        });
        console.log(`Creating ${transactionData.length} transactions`);
        await prisma.transaction.createMany({
          data: transactionData
        });
      })
      .on("error", function (err) {
        console.error("Error reading CSV:", err);
      });
  } catch (error) {
    console.error("Error importing transactions:", error);
  }
};

importTransactions();
