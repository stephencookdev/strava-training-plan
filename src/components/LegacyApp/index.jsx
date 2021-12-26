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
        today={today}
      />
      <WeekPlan weeks={weeks} today={today} />
    </div>
  );
};

export default LegacyApp;
