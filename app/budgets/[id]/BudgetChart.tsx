"use client";

import {Money} from "@/app/Money";
import {getBudgetEndDate} from "@/utils/date";
import dayjs from "dayjs";
import {get} from "http";
import {VegaLite, VisualizationSpec} from "react-vega";
import {scheme} from "vega";

// Define an interpolator function that maps from [0,1] to colors
function grey(f) {
  var g = Math.max(0, Math.min(255, Math.round(255 * f))) + "";
  return "rgb(" + g + ", " + g + ", " + g + ")";
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
                dayjs(endDate).add(1, "day").format("YYYY-MM-DD"),
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
  const projectedSpent = totalSpent + dayLeft * spentPerDay;
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
}

function DetailItem({children}) {
  return (
    <div className="flex justify-between items-center text-sm p-0.5">
      {children}
    </div>
  );
}
