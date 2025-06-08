"use client";

import { Echarts } from "@/components/Echarts/Echarts";
import { useEffect, useState } from "react";

type Props = {
  data: Record<string, number>;
  type: "income" | "expense";
};

export default function CategoryBreakdownChart({ data, type }: Props) {
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      setChartOptions({});
      return;
    }

    const colors = type === "income" 
      ? ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4', '#84CC16', '#EF4444', '#F97316']
      : ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#06B6D4', '#8B5CF6'];

    const chartData = entries.map(([name, value], index) => ({
      name,
      value,
      itemStyle: { 
        color: colors[index % colors.length] 
      }
    }));

    const total = entries.reduce((sum, [, value]) => sum + value, 0);

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
              ${((params.value / total) * 100).toFixed(1)}%
            </div>
          `;
        },
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: {
          color: '#9CA3AF',
          fontSize: 12,
        },
        formatter: function (name: string) {
          const value = data[name];
          const percentage = ((value / total) * 100).toFixed(1);
          return `${name} (${percentage}%)`;
        },
      },
      series: [
        {
          name: `${type} Categories`,
          type: 'pie',
          radius: ['30%', '60%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#1F2937',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          data: chartData,
        },
      ],
    };

    setChartOptions(option);
  }, [data, type]);

  const isEmpty = Object.keys(data).length === 0;

  if (isEmpty) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-400 text-center">
          <div className="text-lg mb-2">📊</div>
          <div>No {type} data for this month</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Echarts options={chartOptions} isLoading={!chartOptions} />
    </div>
  );
}