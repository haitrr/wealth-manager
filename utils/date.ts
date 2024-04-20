import dayjs from "dayjs";

export const formatDate = (date: dayjs.Dayjs) => {
    return date.format("MMM D YYYY");
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