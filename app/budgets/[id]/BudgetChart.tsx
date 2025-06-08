"use client";

import {Money} from "@/app/Money";
import {Echarts} from "@/components/Echarts/Echarts";
import {getBudgetEndDate} from "@/utils/date";
import dayjs from "dayjs";
import {useEffect, useRef, useState, useMemo} from "react";

type Props = {
  transactions: any[];
  budget: any;
};

export function BudgetChart({transactions, budget}: Props) {
  const [chartOptions, setChartOptions] = useState({});
  
  // Memoize expensive calculations to prevent unnecessary re-renders
  const processedData = useMemo(() => {
    const startDate = dayjs(budget.startDate).format("YYYY-MM-DD");
    const endDate = dayjs(getBudgetEndDate(budget)).format("YYYY-MM-DD");
    
    const data = transactions.map((transaction) => ({
      date: dayjs(transaction.date).format("YYYY-MM-DD"),
      value: Number(transaction.value),
      predicted: false,
    }));
    
    const totalSpent = data.reduce(
      (acc, transaction) => acc + transaction.value,
      0,
    );
    
    const dayPassed = dayjs().diff(dayjs(startDate), "day");
    const dayLeft = dayjs(endDate).diff(dayjs(), "day");
    const suggestedSpend = Number(budget.value) - totalSpent;
    const suggestedSpendPerDay = Math.round(suggestedSpend / dayLeft);
    const spentPerDay = Math.round(totalSpent / dayPassed);
    
    // Calculate spent per day for last 7 days
    let spentLast7Days = 0;
    for (let i = 0; i < 7; i++) {
      const date = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      const ts = data.filter((t) => t.date === date);
      for (let t of ts) {
        spentLast7Days += t.value;
      }
    }
    const spentPerDayLast7Days = Math.round(spentLast7Days / 7);
    
    // Fill gaps
    const allDates = Array.from(
      {length: dayjs(dayjs()).diff(dayjs(startDate), "day") + 1},
      (_, i) => dayjs(startDate).add(i, "day").format("YYYY-MM-DD"),
    );
    allDates.forEach((date) => {
      if (!data.find((d) => d.date === date)) {
        data.push({date, value: 0, predicted: false});
      }
    });
    
    const predictedData = Array.from(
      {length: dayjs(endDate).diff(dayjs(), "day") + 1},
      (_, i) => {
        const date = dayjs().add(i, "day").format("YYYY-MM-DD");
        return {date, value: spentPerDayLast7Days, predicted: true};
      },
    );
    
    const predictedSpent = predictedData.reduce(
      (acc, transaction) => acc + transaction.value,
      0,
    );
    const projectedSpent = totalSpent + predictedSpent;
    
    data.push(...predictedData);
    data.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
    
    return {
      data,
      startDate,
      endDate,
      totalSpent,
      spentPerDay,
      projectedSpent,
      suggestedSpendPerDay,
    };
  }, [transactions, budget]);

  const { data, startDate, endDate, totalSpent, spentPerDay, projectedSpent, suggestedSpendPerDay } = processedData;

  // Initialize chart after component mounts
  useEffect(() => {
    const cumulativeData = data.reduce((acc, item) => {
      const lastValue = acc.length > 0 ? acc[acc.length - 1].value : 0;
      acc.push({
        date: item.date,
        value: lastValue + item.value,
        predicted: item.predicted,
      });
      return acc;
    }, [] as {date: string; value: number; predicted: boolean}[]);

    // Separate actual and predicted data for different line styles
    const actualData = cumulativeData
      .filter((item) => !item.predicted)
      .map((item) => [item.date, item.value]);

    const predictedData = cumulativeData
      .filter((item) => item.predicted)
      .map((item) => [item.date, item.value]);

    // Set chart options
    const option = {
      backgroundColor: "#222",
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "time",
        min: startDate,
        max: endDate,
        axisLabel: {
          formatter: "{MM}-{dd}",
          color: "#fff",
          hideOverlap: true,
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: "value",
        max: Number(budget.value) * 1.2,
        axisLabel: {
          color: "#fff",
        },
        splitLine: {
          lineStyle: {
            color: "#333",
          },
        },
      },
      series: [
        {
          data: actualData,
          type: "line",
          smooth: true,
          lineStyle: {
            width: 2,
            color: "green",
          },
          symbol: "none",
        },
        {
          data: predictedData,
          type: "line",
          smooth: true,
          lineStyle: {
            width: 2,
            color: "green",
            type: "dashed",
          },
          symbol: "none",
        },
        {
          type: "line",
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: {
              color: "blue",
              width: 2,
              type: "dashed",
            },
            data: [
              {
                yAxis: Number(budget.value),
                label: {
                  show: false,
                },
              },
            ],
          },
        },
      ],
      tooltip: {
        trigger: "axis",
        formatter: function (params: any) {
          const date = params[0].value[0];
          const value = params[0].value[1] || params[1]?.value[1] || 0;
          return `${dayjs(date).format("MMM D")}: ${value.toLocaleString()}`;
        },
      },
    };
    setChartOptions(option);
  }, [data, budget.value, startDate, endDate]);

  return (
    <div className="w-full flex flex-col">
      <Echarts options={chartOptions} isLoading={!chartOptions} />
      <div className="p-1 bg-gray-900">
        <DetailItem>
          <div>Spent per day</div>
          <Money value={spentPerDay} />
        </DetailItem>
        <DetailItem>
          <div>Projected spending</div>
          <Money value={projectedSpent} />
        </DetailItem>
        <DetailItem>
          <div>Suggested spend per day</div>
          <Money value={suggestedSpendPerDay} />
        </DetailItem>
      </div>
    </div>
  );
}

type DetailItemProps = {
  children: React.ReactNode;
};

function DetailItem({children}: DetailItemProps) {
  return (
    <div className="flex justify-between items-center text-sm p-0.5">
      {children}
    </div>
  );
}
