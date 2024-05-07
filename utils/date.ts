import dayjs from "dayjs";
import { Budget } from "./types";
import { BudgetPeriod } from "@prisma/client";

export const formatDate = (date: dayjs.Dayjs) => {
    return date.format("MMM D YYYY");
};

export const getBudgetEndDate = (budget: Pick<Budget, "startDate" | "period">) => {
    if (budget.period === "MONTHLY") {
        return dayjs(budget.startDate).add(1, "month").toDate();
    }

    if (budget.period === "WEEKLY") {
        return dayjs(budget.startDate).add(1, "week").toDate();
    }

    if (budget.period === "DAILY") {
        return dayjs(budget.startDate).add(1, "day").toDate();
    }

    if (budget.period === "QUARTERLY") {
        return dayjs(budget.startDate).add(3, "month").toDate();
    }

    if (budget.period === "YEARLY") {
        return dayjs(budget.startDate).add(1, "year").toDate();
    }

    throw new Error("Invalid period");
};

export const getDayOfWeek = (date: dayjs.Dayjs) => {
    if (formatDate(date) === formatDate(dayjs())) {
        return "Today";
    }
    if (formatDate(date) === formatDate(dayjs().subtract(1, "day"))) {
        return "Yesterday";
    }
    return date.format("dddd");
};