"use client";

import {Money} from "@/app/Money";
import {getBudgetEndDate} from "@/utils/date";
import dayjs from "dayjs";
import {VegaLite, VisualizationSpec} from "react-vega";

type Props = {
  transactions: any[];
  budget: any;
};

export function BudgetChart({transactions, budget}: Props) {
  const startDate = dayjs(budget.startDate).format("YYYY-MM-DD");
  const endDate = dayjs(getBudgetEndDate(budget)).format("YYYY-MM-DD");
  const spec: VisualizationSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: {name: "values"},
    layer: [
      {
        mark: {
          type: "line",
          stroke: "green",
          clip: true,
        },
        transform: [
          {
            sort: [{field: "date"}],
            window: [{op: "sum", field: "value", as: "cumulative_spent"}],
            frame: [null, 0],
          },
        ],
        encoding: {
          x: {
            field: "date",
            type: "temporal",
            title: null,
            scale: {
              domain: [
                dayjs(startDate).format("YYYY-MM-DD"),
                dayjs(endDate).format("YYYY-MM-DD"),
              ],
            },
            axis: {
              labels: false,
              grid: false,
              ticks: false,
            },
          },
          y: {
            field: "cumulative_spent",
            type: "quantitative",
            title: null,
            axis: {
              labelFontSize: 8,
              ticks: false,
              grid: false,
            },
            scale: {
              domain: [0, Number(budget.value) * 1.2],
            },
          },
          strokeDash: {
            field: "predicted",
            type: "nominal",
            scale: {
              range: [[1, 1]],
              domain: [true, true],
            },
          },
        },
        data: {name: "values"},
      },
      {
        data: {values: [{}]},
        mark: {type: "rule", stroke: "blue", size: 2, strokeDash: [2, 2]},
        encoding: {y: {datum: Number(budget.value)}},
      },
    ],
    width: "container",
    config: {
      legend: {disable: true},
      background: "#222",
      view: {stroke: "#888"},
      title: {color: "#fff", subtitleColor: "#fff"},
      style: {"guide-label": {fill: "#fff"}, "guide-title": {fill: "#fff"}},
      axis: {domainColor: "#fff", gridColor: "#888", tickColor: "#fff"},
    },
  };
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
  const spentPerDayLast7Days = getSpentPerDayLast7Days();
  // filling gaps
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
  return (
    <div className="w-full flex flex-col">
      <VegaLite
        className="w-full"
        actions={false}
        spec={spec}
        data={{values: data}}
      />
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

  function getSpentPerDayLast7Days() {
    let spentLast7Days = 0;
    for (let i = 0; i < 7; i++) {
      const date = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      const ts = data.filter((t) => t.date === date);
      for (let t of ts) {
        spentLast7Days += t.value;
      }
    }
    const spentPerDayLast7Days = Math.round(spentLast7Days / 7);
    return spentPerDayLast7Days;
  }
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
