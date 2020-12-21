import { WEEK_IN_MS, humanDistance, humanPace } from "./unitsUtils";

export const renderMetaStatsHtml = ({
  potential,
  targetRace,
  riegelRacePrediction,
  targetPeak,
  startingMileage,
}) => {
  const msUntilRaceFromTrainingStart =
    targetRace.date - targetRace.trainingStartDate;
  const distanceInc = Math.pow(
    targetPeak.distance / startingMileage,
    WEEK_IN_MS / msUntilRaceFromTrainingStart
  );
  const speedInc =
    1 /
    Math.pow(
      targetPeak.pace / potential.pace,
      WEEK_IN_MS / msUntilRaceFromTrainingStart
    );

  return `
Potential: distance ${humanDistance(potential.distance)} / ${humanPace(
    potential.movingTime,
    potential.distance
  )} pace
Weekly mileage: ${humanDistance(potential.weeklyMileage)}
    
Target pace: ${humanPace(targetRace.movingTime, targetRace.distance)}
Target distance: ${humanDistance(targetRace.distance)}
Riegel pace @ race distance: ${humanPace(
    riegelRacePrediction.timeAtRaceDistance,
    targetRace.distance
  )}
Riegel distance @ race pace: ${humanDistance(
    riegelRacePrediction.distanceAtRacePace
  )}

Distance INC: ${distanceInc.toFixed(2)}
Speed INC: ${speedInc.toFixed(2)}`.trim();
};

export const renderWeekPlanHtml = ({
  weeks,
  region,
  weekPlanString,
  sinceTrainingPlanActivities,
}) => {
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

        return (
          weekSummary + "\n" + weekPlanString(week, sinceTrainingPlanActivities)
        );
      })
      .join("\n\n")
  );
};
