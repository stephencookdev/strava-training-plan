import { DAY_IN_MS, MINUTE_IN_MS, WEEK_IN_MS } from "./datesUtils";
import { KM_IN_METERS } from "./unitsUtils";

const RACE_WEIGHT = 100;
const DAYS_TO_ZERO_WEIGHTING = 7 * 6; // (6 weeks)
const KM_PACE_PER_WEAK_INC = 0.2;
const INITIAL_JUMP = 0.1;

const getTimeWeighting = (activity, targetRace) => {
  const date = activity.date;
  const adjustedStartDate =
    targetRace.trainingStartDates[targetRace.trainingStartDates.length - 1];
  const ZERO_THRESHOLD = DAY_IN_MS * DAYS_TO_ZERO_WEIGHTING;
  const timeOfZero = adjustedStartDate - ZERO_THRESHOLD;

  const t = Math.max(0, Math.min(1, (date - timeOfZero) / ZERO_THRESHOLD));

  return t * t;
};

const getRaceWeighting = (activity) => {
  return activity.isRace ? RACE_WEIGHT : 1;
};

const getWeeklyMileage = (activities, targetRace) => {
  const adjustedDate =
    targetRace.trainingStartDates[targetRace.trainingStartDates.length - 1];
  const sortedActivities = activities.sort((a, b) => a.date - b.date);
  const earliestActivity = sortedActivities[0];
  const latestActivity = sortedActivities[sortedActivities.length - 1];

  const daysBetween = Math.ceil(
    (latestActivity.date - earliestActivity.date) / DAY_IN_MS
  );
  let dayWeightingSum = 0;
  for (let i = 0; i <= daysBetween; i++) {
    dayWeightingSum += getTimeWeighting(
      {
        date: adjustedDate - DAY_IN_MS * i,
      },
      targetRace
    );
  }

  const summedMileage = activities.reduce(
    (acc, cur) => acc + cur.distance * getTimeWeighting(cur, targetRace),
    0
  );

  return (7 * summedMileage) / dayWeightingSum;
};

export const getCurrentPotential = (activities, targetRace) => {
  const cookedActivities = activities.map((activity) => ({
    ...activity,
    weight: getTimeWeighting(activity, targetRace) * getRaceWeighting(activity),
  }));

  const summedActivity = cookedActivities.reduce(
    (acc, activity) => ({
      distance: acc.distance + activity.distance * activity.weight,
      movingTime: acc.movingTime + activity.movingTime * activity.weight,
      weight: acc.weight + activity.weight,
    }),
    { distance: 0, movingTime: 0, weight: 0 }
  );

  const averageActivity = {
    distance: summedActivity.distance / summedActivity.weight,
    movingTime: summedActivity.movingTime / summedActivity.weight,
  };

  const potential = {
    distance: averageActivity.distance,
    movingTime: averageActivity.movingTime,
    pace: averageActivity.movingTime / averageActivity.distance,
    weeklyMileage: getWeeklyMileage(activities, targetRace),
  };

  return potential;
};

export const getPeakReqs = (targetRace) => {
  const peakDistance = 2 * targetRace.distance;

  const targetMsMeterPace = targetRace.movingTime / targetRace.distance;
  const targetMinuteKmPace = (KM_IN_METERS * targetMsMeterPace) / MINUTE_IN_MS;
  const peakMinuteKmPace = targetMinuteKmPace + KM_PACE_PER_WEAK_INC;
  const peakMsMeterPace = (MINUTE_IN_MS * peakMinuteKmPace) / KM_IN_METERS;

  return { distance: peakDistance, pace: peakMsMeterPace };
};

export const Riegel = {
  R: 1.15, // see e.g. https://www.theguardian.com/lifeandstyle/the-running-blog/2018/feb/15/an-updated-formula-for-marathon-running-success
  getNewTime(newDistance, old) {
    return old.movingTime * Math.pow(newDistance / old.distance, Riegel.R);
  },
  getNewDistance(newTime, old) {
    return old.distance * Math.pow(newTime / old.movingTime, 1 / Riegel.R);
  },
};

export const getWeeklyIncs = (potential, targetPeak, targetRace) => {
  const adjustedDate =
    targetRace.trainingStartDates[targetRace.trainingStartDates.length - 1];
  const msUntilRaceFromTrainingStart = targetRace.date - adjustedDate;

  const startingMileage =
    (targetPeak.distance - potential.weeklyMileage) * INITIAL_JUMP +
    potential.weeklyMileage;

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

  // turns 1.2 & 1.1 to 1.15
  // turns 0.9 & 1.1 to 1
  const combinedInc = (speedInc - 1 + (distanceInc - 1)) / 2 + 1;

  return { distanceInc, speedInc, combinedInc };
};
