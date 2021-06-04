import React, { useState, useEffect } from "react";
import { getActivities } from "../../stravaApi";
import { renderWeekPlanHtml, renderMetaStatsHtml } from "../../renderUtils";
import { DAY_IN_MS, MINUTE_IN_MS } from "../../datesUtils";
import { getCurrentPotential, getPeakReqs, Riegel } from "../../runningStats";
import { generateWeeksPlan } from "../../weekPlan";

const REGION = "en-GB";

const TARGET_RACE = {
  distance: 42195,
  movingTime: 14400000,
  trainingStartDate: new Date("2021-05-31"),
  date: new Date("2021-10-17Z09:00"),
  taper: 12 * DAY_IN_MS,
};

const TRAINING_PREFS = {
  0: null, // Monday
  1: "speed", // Tuesday
  2: "recovery", // Wednesday
  3: "recovery", // Thursday
  4: null, // Friday,
  5: null, // Saturday
  6: "long", // Sunday
};

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
  const historicalActivities = useActivities(accessToken, {
    before: TARGET_RACE.trainingStartDate,
  });
  const sinceTrainingPlanActivities = useActivities(accessToken, {
    after: TARGET_RACE.trainingStartDate,
  });

  if (!historicalActivities || !sinceTrainingPlanActivities) {
    return "Loading...";
  }

  const potential = getCurrentPotential(historicalActivities, TARGET_RACE);

  const riegelRacePrediction = {
    timeAtRaceDistance: Riegel.getNewTime(TARGET_RACE.distance, potential),
    distanceAtRacePace: Riegel.getNewDistance(
      TARGET_RACE.movingTime,
      potential
    ),
  };

  const targetPeak = getPeakReqs(TARGET_RACE);

  const weeks = generateWeeksPlan(
    TARGET_RACE,
    TRAINING_PREFS,
    targetPeak,
    potential,
    sinceTrainingPlanActivities
  );

  const metaStatsHtml = renderMetaStatsHtml({
    potential,
    targetRace: TARGET_RACE,
    riegelRacePrediction,
    targetPeak,
  });
  const weekPlanHtml = renderWeekPlanHtml({
    weeks,
    region: REGION,
  });

  return (
    <div style={{ whiteSpace: "pre" }}>
      {metaStatsHtml}
      {"\n\n"}
      {weekPlanHtml}
    </div>
  );
};

export default LegacyApp;
