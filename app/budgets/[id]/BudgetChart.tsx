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
    
    // Aggregate transactions by date to handle multiple transactions on same day
    const transactionsByDate = transactions.reduce((acc, transaction) => {
      const date = dayjs(transaction.date).format("YYYY-MM-DD");
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Number(transaction.value);
      return acc;
    }, {} as Record<string, number>);
    
    const data = Object.entries(transactionsByDate).map(([date, value]) => ({
      date,
      value,
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
        spentLast7Days += Number(t.value);
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
      {length: dayjs(endDate).diff(dayjs(), "day")},
      (_, i) => {
        const date = dayjs().add(i + 1, "day").format("YYYY-MM-DD");
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

    // Add connection point from actual to predicted data
    if (actualData.length > 0 && predictedData.length > 0) {
      const lastActual = actualData[actualData.length - 1];
      predictedData.unshift(lastActual);
    }

    // Set chart options
    const option = {
      backgroundColor: "transparent",
      grid: {
        left: "8%",
        right: "5%",
        bottom: "15%",
        top: "8%",
        containLabel: true,
      },
      xAxis: {
        type: "time",
        min: startDate,
        max: endDate,
        axisLabel: {
          formatter: "{MM}-{dd}",
          color: "#9CA3AF",
          fontSize: 12,
          hideOverlap: true,
        },
        axisLine: {
          lineStyle: {
            color: "#374151",
          },
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: "value",
        max: Number(budget.value) * 1.2,
        axisLabel: {
          color: "#9CA3AF",
          fontSize: 12,
          formatter: (value: number) => {
            if (value >= 1000) {
              return `$${(value / 1000).toFixed(1)}k`;
            }
            return `$${value}`;
          },
        },
        axisLine: {
          lineStyle: {
            color: "#374151",
          },
        },
        splitLine: {
          lineStyle: {
            color: "#374151",
            type: "dashed",
            opacity: 0.5,
          },
        },
      },
      series: [
        {
          data: actualData,
          type: "line",
          smooth: true,
          lineStyle: {
            width: 3,
            color: "#10B981",
            shadowColor: "#10B981",
            shadowBlur: 8,
            shadowOffsetY: 2,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "rgba(16, 185, 129, 0.3)",
                },
                {
                  offset: 1,
                  color: "rgba(16, 185, 129, 0.05)",
                },
              ],
            },
          },
          symbol: "circle",
          symbolSize: 6,
          itemStyle: {
            color: "#10B981",
            borderColor: "#ffffff",
            borderWidth: 2,
          },
          emphasis: {
            itemStyle: {
              color: "#10B981",
              borderColor: "#ffffff",
              borderWidth: 3,
              shadowColor: "#10B981",
              shadowBlur: 10,
            },
          },
        },
        {
          data: predictedData,
          type: "line",
          smooth: true,
          lineStyle: {
            width: 3,
            color: "#10B981",
            type: "dashed",
            opacity: 0.8,
          },
          symbol: "circle",
          symbolSize: 4,
          itemStyle: {
            color: "#10B981",
            borderColor: "#ffffff",
            borderWidth: 1,
            opacity: 0.8,
          },
        },
        {
          type: "line",
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: {
              color: "#EF4444",
              width: 2,
              type: "solid",
              opacity: 0.8,
            },
            data: [
              {
                yAxis: Number(budget.value),
                label: {
                  show: true,
                  position: "insideEndTop",
                  color: "#EF4444",
                  fontSize: 12,
                  fontWeight: "bold",
                  formatter: `Budget: $${Number(budget.value).toLocaleString()}`,
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  padding: [6, 10],
                  borderRadius: 4,
                  distance: 10,
                },
              },
            ],
          },
        },
      ],
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderColor: "#374151",
        borderWidth: 1,
        textStyle: {
          color: "#F9FAFB",
          fontSize: 14,
        },
        formatter: function (params: any) {
          const date = params[0].value[0];
          const value = params[0].value[1] || params[1]?.value[1] || 0;
          const isPredicted = params.some((p: any) => p.seriesIndex === 1);
          const label = isPredicted ? "Projected" : "Actual";
          return `
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${dayjs(date).format("MMM D, YYYY")}
            </div>
            <div style="color: #10B981;">
              ${label}: $${value.toLocaleString()}
            </div>
          `;
        },
        axisPointer: {
          type: "cross",
          crossStyle: {
            color: "#6B7280",
            opacity: 0.6,
          },
        },
      },
    };
    console.log(JSON.stringify(option, null, 2));
    setChartOptions(option);
  }, [data, budget.value, startDate, endDate]);

  return (
    <div className="w-full flex flex-col bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="h-96 p-6">
        <Echarts options={chartOptions} isLoading={!chartOptions} />
      </div>
      <div className="border-t border-gray-700 bg-gray-800/50">
        <div className="p-4 space-y-3">
          <DetailItem>
            <div className="text-gray-300">Spent per day</div>
            <Money value={spentPerDay} />
          </DetailItem>
          <DetailItem>
            <div className="text-gray-300">Projected spending</div>
            <Money value={projectedSpent} />
          </DetailItem>
          <DetailItem>
            <div className="text-gray-300">Suggested spend per day</div>
            <Money value={suggestedSpendPerDay} />
          </DetailItem>
        </div>
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
