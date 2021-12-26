import React, { useState, useEffect, useContext } from "react";
import { getActivities } from "../../stravaApi";
import { renderMetaStatsHtml } from "../../renderUtils";
import { MINUTE_IN_MS } from "../../datesUtils";
import { getCurrentPotential, getPeakReqs, Riegel } from "../../runningStats";
import { generateWeeksPlan } from "../../weekPlan";
import { AppContext } from "../App";
import WeekPlan from "../WeekPlan";
import WeekGraph from "../WeekGraph";

const useActivities = (accessToken, filters) => {
  const [activities, setActivities] = useState(null);

  const now = Date.now();
  const storedKey = JSON.stringify(filters);
  const storedExpiresAtKey = `${storedKey}__expires_at`;
  useEffect(() => {
    (async () => {
      const storedItem = localStorage.getItem(storedKey);
      const storedItemExpiresAt = parseInt(
        localStorage.getItem(storedExpiresAtKey)
      );
      if (
        storedItem &&
        (storedItemExpiresAt === -1 || now < storedItemExpiresAt)
      ) {
        setActivities(
          JSON.parse(storedItem).map((activity) => ({
            ...activity,
            date: new Date(activity.date),
          }))
        );
      } else {
        const activities = await getActivities(accessToken, filters);
        setActivities(activities);

        localStorage.setItem(storedKey, JSON.stringify(activities));
        localStorage.setItem(
          storedExpiresAtKey,
          filters.before < now ? -1 : now + MINUTE_IN_MS * 5
        );
      }
    })();
  }, [accessToken, storedKey]);

  return activities;
};

const LegacyApp = ({ accessToken }) => {
  const { targetRace, trainingPrefs, today } = useContext(AppContext);
  const historicalActivities = useActivities(accessToken, {
    before: targetRace.trainingStartDate,
  });
  const sinceTrainingPlanActivities = useActivities(accessToken, {
    after: targetRace.trainingStartDate,
  });

  if (!historicalActivities || !sinceTrainingPlanActivities) {
    return "Loading...";
  }

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
