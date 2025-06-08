"use client";

import { Echarts } from "@/components/Echarts/Echarts";
import { Money } from "@/app/Money";
import { useEffect, useState } from "react";

type Props = {
  income: number;
  expense: number;
};

export default function IncomeExpenseChart({ income, expense }: Props) {
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    const data = [
      { name: 'Income', value: income, itemStyle: { color: '#10B981' } },
      { name: 'Expense', value: expense, itemStyle: { color: '#EF4444' } }
    ];

    const option = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: 'item',
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderColor: "#374151",
        borderWidth: 1,
        textStyle: {
          color: "#F9FAFB",
          fontSize: 14,
        },
        formatter: function (params: any) {
          return `
            <div style="font-weight: bold; color: ${params.data.itemStyle.color};">
              ${params.name}
            </div>
            <div style="margin-top: 4px;">
              Amount: ${params.value.toLocaleString()}
            </div>
            <div style="color: #9CA3AF;">
              ${((params.value / (income + expense)) * 100).toFixed(1)}%
            </div>
          `;
        },
      },
      legend: {
        orient: 'horizontal',
        bottom: '5%',
        textStyle: {
          color: '#9CA3AF',
          fontSize: 14,
        },
      },
      series: [
        {
          name: 'Income vs Expense',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#1F2937',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              color: '#F9FAFB',
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          data: data,
        },
      ],
    };

    setChartOptions(option);
  }, [income, expense]);

  const netIncome = income - expense;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-center">
          <div className="text-sm font-medium text-green-400 mb-1">Total Income</div>
          <div className="text-xl font-bold text-green-300">
            <Money value={income} />
          </div>
        </div>
        
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-center">
          <div className="text-sm font-medium text-red-400 mb-1">Total Expense</div>
          <div className="text-xl font-bold text-red-300">
            <Money value={-expense} />
          </div>
        </div>
        
        <div className={`border rounded-lg p-4 text-center ${
          netIncome >= 0 
            ? 'bg-blue-900/30 border-blue-800' 
            : 'bg-orange-900/30 border-orange-800'
        }`}>
          <div className={`text-sm font-medium mb-1 ${
            netIncome >= 0 ? 'text-blue-400' : 'text-orange-400'
          }`}>
            Net Income
          </div>
          <div className={`text-xl font-bold ${
            netIncome >= 0 ? 'text-blue-300' : 'text-orange-300'
          }`}>
            <Money value={netIncome} />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-full">
        <Echarts options={chartOptions} isLoading={!chartOptions} />
      </div>
    </div>
  );
}