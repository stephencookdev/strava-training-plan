import { DAY_IN_MS, WEEK_IN_MS } from "./datesUtils";

const RACE_WEIGHT = 100;
const DAYS_TO_ZERO_WEIGHTING = 7 * 6; // (6 weeks)
const KM_PACE_PER_WEAK_INC = 0.2;
const INITIAL_JUMP = 0.1;

const getTimeWeighting = (activity, target) => {
  const date = activity.date;
  const ZERO_THRESHOLD = DAY_IN_MS * DAYS_TO_ZERO_WEIGHTING;
  const timeOfZero = target.trainingStartDate - ZERO_THRESHOLD;

  const t = Math.max(0, Math.min(1, (date - timeOfZero) / ZERO_THRESHOLD));

  return t * t;
};

const getRaceWeighting = (activity) => {
  return activity.isRace ? RACE_WEIGHT : 1;
};

const getWeeklyMileage = (activities, target) => {
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
        date: target.trainingStartDate - DAY_IN_MS * i,
      },
      target
    );
  }

  const summedMileage = activities.reduce(
    (acc, cur) => acc + cur.distance * getTimeWeighting(cur, target),
    0
  );

  return (7 * summedMileage) / dayWeightingSum;
};

export const getCurrentPotential = (activities, target) => {
  const cookedActivities = activities.map((activity) => ({
    ...activity,
    weight: getTimeWeighting(activity, target) * getRaceWeighting(activity),
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
    weeklyMileage: getWeeklyMileage(activities, target),
  };

  return potential;
};

export const getPeakReqs = (target) => {
  const peakDistance = 2 * target.distance;

  const targetSecondMeterPace = target.movingTime / target.distance;
  const targetMinuteKmPace = (1000 * targetSecondMeterPace) / 60;
  const peakMinuteKmPace = targetMinuteKmPace + KM_PACE_PER_WEAK_INC;
  const peakSecondMeterPace = (60 * peakMinuteKmPace) / 1000;

  return { distance: peakDistance, pace: peakSecondMeterPace };
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

export const getWeeklyIncs = (potential, targetPeak, target) => {
  const msUntilRaceFromTrainingStart = target.date - target.trainingStartDate;

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

  return { distanceInc, speedInc };
};
