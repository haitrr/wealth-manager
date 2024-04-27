"use client"

import { VegaLite, VisualizationSpec } from "react-vega";

export function BudgetChart() {
    const spec1: VisualizationSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "data": {"url": "data/movies.json"},
        "transform": [{
          "aggregate":[{"op": "count", "field": "*", "as": "count"}],
          "groupby": ["IMDB Rating"]
        },
        {
          "sort": [{"field": "IMDB Rating"}],
          "window": [{"op": "sum", "field": "count", "as": "Cumulative Count"}],
          "frame": [null, 0]
        }],
        "mark": "area",
        "encoding": {
          "x": {
            "field": "IMDB Rating",
            "type": "quantitative"
          },
          "y": {
            "field": "Cumulative Count",
            "type": "quantitative"
          }
        }
      };
      const data1 = {
        myData: [
          { a: 'A', b: 20 },
          { a: 'B', b: 34 },
          { a: 'C', b: 55 },
          { a: 'D', b: 19 },
          { a: 'E', b: 40 },
          { a: 'F', b: 34 },
          { a: 'G', b: 91 },
          { a: 'H', b: 78 },
          { a: 'I', b: 25 },
        ],
      };
  return <div>
    <div>Chart</div>
    <VegaLite spec={spec1} />
  </div>;
}