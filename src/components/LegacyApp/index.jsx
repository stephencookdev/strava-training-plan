import React, { useContext } from "react";
import { renderMetaStatsHtml } from "../../renderUtils";
import {
  getCurrentPotential,
  getPeakReqs,
  getWeeklyIncs,
  Riegel,
} from "../../runningStats";
import { generateWeeksPlan } from "../../weekPlan";
import { AppContext } from "../App";
import WeekPlan from "../WeekPlan";
import WeekGraph from "../WeekGraph";
import ScoreAdjust from "../ScoreAdjust";
import DifficultyAdjust from "../DifficultyAdjust";

const LegacyApp = () => {
  const { targetRace, trainingPrefs, activities, today } =
    useContext(AppContext);

  const adjustedDate =
    targetRace.trainingStartDates[targetRace.trainingStartDates.length - 1];

  const relevantActivities = activities.filter((a) => a.date < today);
  const historicalActivities = activities.filter((a) => a.date < adjustedDate);

  const potential = getCurrentPotential(historicalActivities, targetRace);
  const liveAdjustedPotential = getCurrentPotential(relevantActivities, {
    ...targetRace,
    trainingStartDates: [today],
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
    relevantActivities,
    today
  );
  const liveAdjustedWeeks = generateWeeksPlan(
    {
      ...targetRace,
      trainingStartDates: [today],
    },
    trainingPrefs,
    targetPeak,
    liveAdjustedPotential,
    relevantActivities,
    today
  );

  const weekDiff = weeks
    .map((w) => {
      const matchedWeek = liveAdjustedWeeks.find(
        (adj) => adj.weekStart === w.weekStart
      );
      const plannedDistance = w.distance;
      const projectedActualDistance = matchedWeek
        ? matchedWeek.distance
        : w.activitiesOfWeek.reduce((acc, cur) => acc + cur.distance, 0);

      return projectedActualDistance - plannedDistance;
    })
    .reduce((acc, cur) => acc + cur, 0);
  const totalWeekDistance = weeks
    .map((w) => w.distance)
    .reduce((acc, cur) => acc + cur, 0);
  const weekDiffScore = (weekDiff * 20) / (3 * totalWeekDistance);

  const { combinedInc } = getWeeklyIncs(potential, targetPeak, targetRace);
  const difficulty = (combinedInc - 1) / 0.1;

  const metaStatsHtml = renderMetaStatsHtml({
    potential,
    targetRace,
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
      {weekDiffScore <= -1 && <ScoreAdjust />}
      <DifficultyAdjust difficulty={difficulty} />
      <WeekPlan weeks={weeks} today={today} />
    </div>
  );
};

export default LegacyApp;
