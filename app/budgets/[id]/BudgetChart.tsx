"use client";

import {getBudgetEndDate} from "@/utils/date";
import dayjs from "dayjs";
import {get} from "http";
import {VegaLite, VisualizationSpec} from "react-vega";
import { scheme } from "vega";


// Define an interpolator function that maps from [0,1] to colors
function grey(f) {
    var g = Math.max(0, Math.min(255, Math.round(255 * f))) + '';
    return 'rgb(' + g + ', ' + g + ', ' + g + ')';
  }
  
  // Register the interpolator. Now the scheme "mygrey" can be used in Vega specs
scheme("mygrey", grey);

export function BudgetChart({transactions, budget}) {
  const startDate = dayjs(budget.startDate).format("YYYY-MM-DD");
  const endDate = dayjs(getBudgetEndDate(budget)).format("YYYY-MM-DD");
  const spec: VisualizationSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: {name: "values"},
    layer: [
      {
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
              grid: false,
            },
            scale: {
              domain: [0, Number(budget.value) * 1.2],
            },
          },
          strokeDash: {field: "predicted", type: "nominal"},
        },
        data: {name: "values"},
      },
      {
        data: {values: [{}]},
        mark: {type: "rule", size: 2, strokeDash: [2, 2]},
        encoding: {y: {datum: Number(budget.value)}},
      },
    ],
    width: "container",
    config: {
      legend: {disable: true},
      "background": "#222",
      "view": {"stroke": "#888"},
      "title": {"color": "#fff", "subtitleColor": "#fff"},
      "style": {"guide-label": {"fill": "#fff"}, "guide-title": {"fill": "#fff"}},
      "axis": {"domainColor": "#fff", "gridColor": "#888", "tickColor": "#fff"}
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
  console.log(JSON.stringify(data), JSON.stringify(spec));
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
