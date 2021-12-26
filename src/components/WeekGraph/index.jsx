import React, { useContext } from "react";
import { Chart, registerables } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { AppContext } from "../App";

Chart.register(...registerables);

const PLANNED_TENSION = 0.35;
const ACTUAL_TENSION = 0.2;

const color = (c) => ({
  borderColor: c,
  backgroundColor: c,
});

const range =
  (...rs) =>
  (score) => {
    const matchingR = rs.sort(
      (a, b) =>
        Math.min(Math.abs(score - a[0]), Math.abs(score - a[1])) -
        Math.min(Math.abs(score - b[0]), Math.abs(score - b[1]))
    )[0];

    const [fromMin, fromMax, toMin, toMax] = matchingR;
    const fromI = Math.min(
      1,
      Math.max(0, (score - fromMin) / (fromMax - fromMin))
    );
    const to = toMin + (toMax - toMin) * fromI;

    return to;
  };

const WeekGraph = ({ weeks, liveAdjustedWeeks, weekDiffScore }) => {
  const { region } = useContext(AppContext);
  const dateF = new Intl.DateTimeFormat(region, {
    day: "numeric",
    month: "short",
  });

  return (
    <div style={{ maxWidth: "800px" }}>
      <Line
        data={{
          labels: weeks.map((w) => dateF.format(w.weekStart)),
          datasets: [
            {
              label: "Planned distance",
              data: weeks.map((w) => w.distance),
              tension: PLANNED_TENSION,
              ...color("rgb(99, 200, 132)"),
            },
            {
              label: "Actual distance",
              data: weeks
                .filter((w) => w.activitiesOfWeek)
                .map((w) =>
                  w.activitiesOfWeek.reduce((acc, cur) => acc + cur.distance, 0)
                ),
              tension: ACTUAL_TENSION,
              ...color("rgb(255, 99, 132)"),
            },
            {
              label: "Adjusted distance",
              data: weeks.map((w) => {
                const adjustedWeek = liveAdjustedWeeks.find(
                  (adj) => adj.weekStart === w.weekStart
                );
                return adjustedWeek && !w.activitiesOfWeek
                  ? adjustedWeek.distance
                  : w.activitiesOfWeek.reduce(
                      (acc, cur) => acc + cur.distance,
                      0
                    );
              }),
              tension: ACTUAL_TENSION,
            },
          ],
        }}
      />
      <Bar
        options={{
          scales: {
            y: {
              min: -1,
              max: 1,
            },
          },
        }}
        data={{
          labels: ["Score"],
          datasets: [
            {
              label: "Score",
              data: [weekDiffScore],
              ...color(
                `rgb(${range([-1, 0, 200, 100])(weekDiffScore)}, ${range([
                  -1, 0, 100, 200,
                ])(weekDiffScore)}, ${range(
                  [-0.3, -0.5, 130, 230],
                  [-0.5, -0.7, 230, 130]
                )(weekDiffScore)})`
              ),
            },
          ],
        }}
      />
    </div>
  );
};

export default WeekGraph;
