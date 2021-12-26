import React, { useContext } from "react";
import { DAY_IN_MS } from "../../datesUtils";
import { humanDistance, humanPace } from "../../unitsUtils";
import { AppContext } from "../App";

const Plan = ({ plan = {}, activitiesOfWeek = [] }) => {
  const { region } = useContext(AppContext);
  const dateF = new Intl.DateTimeFormat(region, {
    weekday: "short",
    day: "numeric",
  });

  const toDoActivities = Object.values(plan).map((activity) => ({
    date: activity.date,
    el: (
      <div
        key={activity.date}
        style={{
          border: "1px solid lightgrey",
          padding: "16px",
          marginBottom: "32px",
        }}
      >
        <h2>{dateF.format(activity.date)}</h2>
        <div>{activity.runType}</div>
        <div>{`${humanDistance(activity.distance)} @ ${humanPace(
          activity.movingTime,
          activity.distance
        )}`}</div>
      </div>
    ),
  }));

  const doneActivities = activitiesOfWeek.map((activity) => ({
    date: activity.date,
    el: (
      <div
        key={activity.date}
        style={{
          border: "1px solid green",
          background: "#efe",
          padding: "16px",
          marginBottom: "32px",
        }}
      >
        <h2>{dateF.format(activity.date)}</h2>
        {activity.suggestedPlan && <div>{activity.suggestedPlan.runType}</div>}
        <div>{`${humanDistance(activity.distance)} @ ${humanPace(
          activity.movingTime,
          activity.distance
        )}`}</div>
      </div>
    ),
  }));

  const els = doneActivities
    .concat(toDoActivities)
    .sort((a, b) => a.date - b.date)
    .map(({ el }) => el);

  return <div style={{ display: "flex" }}>{els}</div>;
};

const WeekPlan = ({ weeks, today }) => {
  const { region } = useContext(AppContext);
  const dateF = new Intl.DateTimeFormat(region, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      {weeks.map((week, i) => {
        const isPast = week.weekEnd < today;
        const isCurrent = week.weekStart < today && week.weekEnd > today;

        return (
          <details
            key={week.weekStart}
            style={{ opacity: isPast ? 0.5 : 1 }}
            open={!isPast}
          >
            <summary>
              <h1
                style={{
                  display: "inline-block",
                  color: isCurrent ? "#d32" : "inherit",
                }}
              >
                Week {i + 1},{" "}
                {[week.weekStart, week.weekEnd - DAY_IN_MS]
                  .map(dateF.format)
                  .join(" – ")}
                {isCurrent && " 🏃‍♂️"}
              </h1>
            </summary>
            <p>Total planned distance: {humanDistance(week.distance)}</p>
            {week.activitiesOfWeek && (
              <p>
                Total run distance:{" "}
                {humanDistance(
                  week.activitiesOfWeek.reduce(
                    (acc, cur) => acc + cur.distance,
                    0
                  )
                )}
              </p>
            )}
            <Plan plan={week.plan} activitiesOfWeek={week.activitiesOfWeek} />
          </details>
        );
      })}
    </>
  );
};

export default WeekPlan;
