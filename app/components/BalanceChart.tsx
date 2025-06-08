"use client";

import { Echarts } from "@/components/Echarts/Echarts";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useEffect, useState, useMemo } from "react";

dayjs.extend(isSameOrBefore);

type Transaction = {
  id: string;
  date: Date;
  value: number;
  category: {
    type: string;
  };
};

type Props = {
  transactions: Transaction[];
  initialBalance: number;
};

export function BalanceChart({ transactions, initialBalance }: Props) {
  const [chartOptions, setChartOptions] = useState({});

  const processedData = useMemo(() => {
    const startOfMonth = dayjs().startOf('month');
    const endOfMonth = dayjs().endOf('month');
    const today = dayjs();
    
    // Create daily balance data
    const dailyData: { date: string; balance: number }[] = [];
    let currentBalance = initialBalance;
    
    // Generate all days in the month
    const daysInMonth = endOfMonth.diff(startOfMonth, 'day') + 1;
    
    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = startOfMonth.add(i, 'day');
      const dateStr = currentDate.format('YYYY-MM-DD');
      
      // Get transactions for this day
      const dayTransactions = transactions.filter(t => 
        dayjs(t.date).format('YYYY-MM-DD') === dateStr
      );
      
      // Calculate balance change for this day
      const dayChange = dayTransactions.reduce((acc, t) => {
        // Income increases balance, expense decreases balance
        const isIncome = ['INCOME', 'LOAN_COLLECTION', 'LOAN_INTEREST_COLLECTION'].includes(t.category.type);
        const isExpense = ['EXPENSE', 'BORROWING_PAYMENT', 'BORROWING_INTEREST_PAYMENT'].includes(t.category.type);
        
        if (isIncome) {
          return acc + t.value;
        } else if (isExpense) {
          return acc - t.value;
        } else if (t.category.type === 'BORROWING') {
          return acc + t.value; // Borrowing increases available cash
        } else if (t.category.type === 'LOAN') {
          return acc - t.value; // Giving loan decreases available cash
        }
        return acc;
      }, 0);
      
      currentBalance += dayChange;
      
      // Only include data up to today for actual data
      if (currentDate.isSameOrBefore(today, 'day')) {
        dailyData.push({
          date: dateStr,
          balance: currentBalance
        });
      }
    }
    
    return dailyData;
  }, [transactions, initialBalance]);

  useEffect(() => {
    if (processedData.length === 0) return;

    const option = {
      backgroundColor: "transparent",
      grid: {
        left: "12%",
        right: "5%",
        bottom: "15%",
        top: "8%",
        containLabel: true,
      },
      xAxis: {
        type: "time",
        min: dayjs().startOf('month').format('YYYY-MM-DD'),
        max: dayjs().endOf('month').format('YYYY-MM-DD'),
        axisLabel: {
          formatter: "{dd}",
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
        axisLabel: {
          color: "#9CA3AF",
          fontSize: 12,
          formatter: (value: number) => {
            if (Math.abs(value) >= 1000000) {
              return `${(value / 1000000).toFixed(1)}M`;
            } else if (Math.abs(value) >= 1000) {
              return `${(value / 1000).toFixed(0)}k`;
            }
            return `${value}`;
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
          data: processedData.map(item => [item.date, item.balance]),
          type: "line",
          smooth: true,
          lineStyle: {
            width: 3,
            color: "#3B82F6",
            shadowColor: "#3B82F6",
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
                  color: "rgba(59, 130, 246, 0.3)",
                },
                {
                  offset: 1,
                  color: "rgba(59, 130, 246, 0.05)",
                },
              ],
            },
          },
          symbol: "circle",
          symbolSize: 6,
          itemStyle: {
            color: "#3B82F6",
            borderColor: "#ffffff",
            borderWidth: 2,
          },
          emphasis: {
            itemStyle: {
              color: "#3B82F6",
              borderColor: "#ffffff",
              borderWidth: 3,
              shadowColor: "#3B82F6",
              shadowBlur: 10,
            },
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
          const balance = params[0].value[1];
          return `
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${dayjs(date).format("MMM D, YYYY")}
            </div>
            <div style="color: #3B82F6;">
              Balance: ${balance.toLocaleString()}
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

    setChartOptions(option);
  }, [processedData]);

  return (
    <div className="w-full h-80">
      <Echarts options={chartOptions} isLoading={!chartOptions} />
    </div>
  );
}