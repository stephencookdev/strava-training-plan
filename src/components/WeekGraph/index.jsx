import React, { useContext } from "react";
import { Chart, registerables } from "chart.js";
import { Line } from "react-chartjs-2";
import { AppContext } from "../App";

Chart.register(...registerables);

const PLANNED_TENSION = 0.35;
const ACTUAL_TENSION = 0.2;

const color = (c) => ({
  borderColor: c,
  backgroundColor: c,
});

const WeekGraph = ({ weeks, liveAdjustedWeeks, weekDiffScore }) => {
  const { region, targetRace } = useContext(AppContext);
  const dateF = new Intl.DateTimeFormat(region, {
    day: "numeric",
    month: "short",
  });

  const adjustedDate =
    targetRace.trainingStartDates[targetRace.trainingStartDates.length - 1];

  return (
    <div style={{ maxWidth: "800px" }}>
      <Line
        data={{
          labels: weeks.map((w) => dateF.format(w.weekStart)),
          datasets: [
            {
              label: "Planned distance",
              data: weeks.map((w) =>
                w.weekEnd < adjustedDate ? null : w.distance
              ),
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
    </div>
  );
};

export default WeekGraph;
