import React, { useContext } from "react";
import { renderMetaStatsHtml } from "../../renderUtils";
import { getCurrentPotential, getPeakReqs, Riegel } from "../../runningStats";
import { generateWeeksPlan } from "../../weekPlan";
import { AppContext } from "../App";
import WeekPlan from "../WeekPlan";
import WeekGraph from "../WeekGraph";

const LegacyApp = () => {
  const {
    targetRace,
    trainingPrefs,
    historicalActivities,
    sinceTrainingPlanActivities,
    today,
  } = useContext(AppContext);

  const allActivities = [
    ...historicalActivities,
    ...sinceTrainingPlanActivities,
  ].filter((a) => a.date < today);

  const potential = getCurrentPotential(historicalActivities, targetRace);
  const liveAdjustedPotential = getCurrentPotential(allActivities, {
    ...targetRace,
    trainingStartDate: today,
  });

  const riegelRacePrediction = {
    timeAtRaceDistance: Riegel.getNewTime(targetRace.distance, potential),
    distanceAtRacePace: Riegel.getNewDistance(targetRace.movingTime, potential),
  };

  const targetPeak = getPeakReqs(targetRace);

  const weeks = generateWeeksPlan(
    targetRace,
    trainingPrefs,
    targetPeak,
    potential,
    sinceTrainingPlanActivities,
    today
  );
  const liveAdjustedWeeks = generateWeeksPlan(
    {
      ...targetRace,
      trainingStartDate: today,
    },
    trainingPrefs,
    targetPeak,
    liveAdjustedPotential,
    allActivities,
    today
  );

  const weekDiff = liveAdjustedWeeks
    .map((adj) => {
      const matchedWeek = weeks.find((w) => w.weekStart === adj.weekStart);
      return adj.distance - matchedWeek.distance;
    })
    .reduce((acc, cur) => acc + cur, 0);
  const totalWeekDistance = weeks
    .map((w) => w.distance)
    .reduce((acc, cur) => acc + cur, 0);
  const weekDiffScore = (weekDiff * 20) / (3 * totalWeekDistance);

  const metaStatsHtml = renderMetaStatsHtml({
    potential,
    targetRace: targetRace,
    riegelRacePrediction,
    targetPeak,
  });

  return (
    <div style={{ whiteSpace: "pre" }}>
      {metaStatsHtml}
      {"\n\n"}
      <WeekGraph
        weeks={weeks}
        liveAdjustedWeeks={liveAdjustedWeeks}
        weekDiffScore={weekDiffScore}
      />
      <WeekPlan weeks={weeks} today={today} />
    </div>
  );
};

export default LegacyApp;
