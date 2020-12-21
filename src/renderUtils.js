import { humanDistance, humanPace } from "./unitsUtils";
import { getWeeklyIncs } from "./runningStats";

const DAY_MAP = {
  0: "Monday",
  1: "Tuesday",
  2: "Wednesday",
  3: "Thursday",
  4: "Friday",
  5: "Saturday",
  6: "Sunday",
};

export const renderMetaStatsHtml = ({
  potential,
  target,
  riegelRacePrediction,
  targetPeak,
}) => {
  const { distanceInc, speedInc } = getWeeklyIncs(
    potential,
    targetPeak,
    target
  );

  return `
Potential: distance ${humanDistance(potential.distance)} / ${humanPace(
    potential.movingTime,
    potential.distance
  )} pace
Weekly mileage: ${humanDistance(potential.weeklyMileage)}
    
Target pace: ${humanPace(target.movingTime, target.distance)}
Target distance: ${humanDistance(target.distance)}
Riegel pace @ race distance: ${humanPace(
    riegelRacePrediction.timeAtRaceDistance,
    target.distance
  )}
Riegel distance @ race pace: ${humanDistance(
    riegelRacePrediction.distanceAtRacePace
  )}

Distance INC: ${distanceInc.toFixed(2)}
Speed INC: ${speedInc.toFixed(2)}`.trim();
};

const humanWeekActivitiesSoFar = (activitiesOfWeek) => {
  return activitiesOfWeek
    .map((activity) => ` - ${humanActivity(activity)}`)
    .join("\n");
};

const humanPlan = (plan) => {
  return Object.keys(plan)
    .map((dayKey) => `${DAY_MAP[dayKey]}: ${humanActivity(plan[dayKey])}`)
    .join("\n");
};

const humanActivity = (activity) => {
  const parts = [];

  if (activity.runType) parts.push(`(${activity.runType})`);

  if (activity.movingTime && activity.distance)
    parts.push(
      `${humanDistance(activity.distance)} @ ${humanPace(
        activity.movingTime,
        activity.distance
      )}`
    );

  return parts.join(" ");
};

const weekPlanString = (week) => {
  if (week.weekEnd < Date.now()) {
    return (
      "DONE!\n" +
      humanWeekActivitiesSoFar(week.activitiesOfWeek) +
      "\n" +
      `(total ${humanActivity(week.totalActivities)})`
    );
  } else if (week.weekStart > Date.now()) {
    return humanPlan(week.plan);
  } else {
    return (
      humanWeekActivitiesSoFar(week.activitiesOfWeek) +
      "\n" +
      humanPlan(week.plan)
    );
  }
};

export const renderWeekPlanHtml = ({ weeks, region }) => {
  return (
    "Weeks:\n" +
    weeks
      .map((week) => {
        const start = new Date(week.weekStart);
        const dateF = new Intl.DateTimeFormat(region, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        const weekSummary = `Week of ${dateF.format(start)} — ${humanDistance(
          week.distance
        )} / ${humanPace(week.pace, 1)}`;

        return weekSummary + "\n" + weekPlanString(week);
      })
      .join("\n\n")
  );
};
