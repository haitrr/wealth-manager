"use client";

import {getBudgetEndDate} from "@/utils/date";
import dayjs from "dayjs";
import {get} from "http";
import {VegaLite, VisualizationSpec} from "react-vega";

export function BudgetChart({transactions, budget}) {
  const startDate = dayjs(budget.startDate).format("YYYY-MM-DD");
  const endDate = dayjs(getBudgetEndDate(budget)).format("YYYY-MM-DD");
  const spec: VisualizationSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    mark: "line",
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
        scale: {domain: [startDate, endDate]},
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
        },
      },
      strokeDash: {field: "predicted", type: "nominal"},
    },
    data: {name: "values"},
    width: "container",
    config: {
      legend: {disable: true},
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
  const spentPerDay = Math.round(
    totalSpent / dayjs(endDate).diff(dayjs(startDate), "day"),
  );
  const predictedData = Array.from(
    {length: dayjs(endDate).diff(dayjs(), "day")},
    (_, i) => {
      const date = dayjs()
        .add(i + 1, "day")
        .format("YYYY-MM-DD");
      return {date, value: spentPerDay, predicted: true};
    },
  );
  data.push(...predictedData);
  // filling gaps
  const allDates = Array.from(
    {length: dayjs(endDate).diff(dayjs(startDate), "day")},
    (_, i) => dayjs(startDate).add(i, "day").format("YYYY-MM-DD"),
  );
  allDates.forEach((date) => {
    if (!data.find((d) => d.date === date)) {
      data.push({date, value: 0, predicted: false});
    }
  });
  data.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
  return (
    <div className="w-full flex ">
      <VegaLite
        className="w-full"
        actions={false}
        spec={spec}
        data={{values: data}}
      />
    </div>
  );
}
