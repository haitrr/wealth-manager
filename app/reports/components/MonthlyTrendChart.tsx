"use client";

import { Echarts } from "@/components/Echarts/Echarts";
import { EXPENSE_CATEGORY_TYPES, INCOME_CATEGORY_TYPES } from "@/lib/utils";
import { CategoryType } from "@prisma/client";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

type Transaction = {
  value: number;
  date: Date;
  category: {
    type: CategoryType;
  };
};

type Props = {
  transactions: Transaction[];
};

export default function MonthlyTrendChart({ transactions }: Props) {
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    // Group transactions by month
    const monthlyData = new Map<string, { income: number; expense: number }>();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = dayjs().subtract(i, 'month').format('YYYY-MM');
      monthlyData.set(month, { income: 0, expense: 0 });
    }

    // Aggregate transactions by month
    transactions.forEach(transaction => {
      const month = dayjs(transaction.date).format('YYYY-MM');
      const data = monthlyData.get(month);
      
      if (data) {
        if (INCOME_CATEGORY_TYPES.includes(transaction.category.type)) {
          data.income += transaction.value;
        } else if (EXPENSE_CATEGORY_TYPES.includes(transaction.category.type)) {
          data.expense += transaction.value;
        }
      }
    });

    const months = Array.from(monthlyData.keys()).sort();
    const incomeData = months.map(month => monthlyData.get(month)?.income || 0);
    const expenseData = months.map(month => monthlyData.get(month)?.expense || 0);
    const monthLabels = months.map(month => dayjs(month).format('MMM YYYY'));

    const option = {
      backgroundColor: "transparent",
      grid: {
        left: "12%",
        right: "5%",
        bottom: "15%",
        top: "10%",
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: monthLabels,
        axisLabel: {
          color: "#9CA3AF",
          fontSize: 12,
          rotate: 45,
        },
        axisLine: {
          lineStyle: {
            color: "#374151",
          },
        },
      },
      yAxis: {
        type: 'value',
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
      legend: {
        data: ['Income', 'Expense'],
        textStyle: {
          color: '#9CA3AF',
          fontSize: 14,
        },
        top: '5%',
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderColor: "#374151",
        borderWidth: 1,
        textStyle: {
          color: "#F9FAFB",
          fontSize: 14,
        },
        formatter: function (params: any) {
          const month = params[0].name;
          let tooltip = `<div style="font-weight: bold; margin-bottom: 8px;">${month}</div>`;
          
          params.forEach((param: any) => {
            const color = param.color;
            const name = param.seriesName;
            const value = param.value;
            tooltip += `
              <div style="margin: 4px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; margin-right: 8px; border-radius: 50%;"></span>
                ${name}: ${value.toLocaleString()}
              </div>
            `;
          });
          
          // Calculate net income
          const income = params.find((p: any) => p.seriesName === 'Income')?.value || 0;
          const expense = params.find((p: any) => p.seriesName === 'Expense')?.value || 0;
          const net = income - expense;
          const netColor = net >= 0 ? '#10B981' : '#EF4444';
          
          tooltip += `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #374151;">
              <span style="color: ${netColor}; font-weight: bold;">
                Net: ${net.toLocaleString()}
              </span>
            </div>
          `;
          
          return tooltip;
        },
      },
      series: [
        {
          name: 'Income',
          type: 'bar',
          data: incomeData,
          itemStyle: {
            color: '#10B981',
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: '#059669',
            },
          },
        },
        {
          name: 'Expense',
          type: 'bar',
          data: expenseData,
          itemStyle: {
            color: '#EF4444',
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: '#DC2626',
            },
          },
        },
      ],
    };

    setChartOptions(option);
  }, [transactions]);

  return (
    <div className="w-full h-80">
      <Echarts options={chartOptions} isLoading={!chartOptions} />
    </div>
  );
}