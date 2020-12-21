import { permutator } from "./miscUtils";
import {
  DAY_IN_MS,
  WEEK_IN_MS,
  getStartOfDay,
  getEndOfDay,
} from "./datesUtils";
import { getWeeklyIncs } from "./runningStats";

const TAPER_REDUCTION = 0.65;

const PREF_MAP = {
  speed: { distanceWeight: 1.1 },
  recovery: { distanceWeight: 1 },
  long: { distanceWeight: 3, targetPace: true },
};

const getRawWeeks = (target, targetPeak, distanceInc, speedInc) => {
  // normalise our INC vars, we shouldn't ever be decreasing things
  distanceInc = Math.max(1, distanceInc);
  speedInc = Math.max(1, speedInc);

  const numberOfDays = Math.ceil(
    (target.date - target.trainingStartDate) / DAY_IN_MS
  );
  const numberOfWeeks = Math.floor(numberOfDays / 7);

  const weeks = [];
  for (let i = 0; i < numberOfWeeks; i++) {
    const power = numberOfWeeks - i - 1;

    weeks[i] = {
      distance: targetPeak.distance * Math.pow(1 / distanceInc, power),
      pace: targetPeak.pace * Math.pow(speedInc, power),
      weekStart:
        getStartOfDay(target.date - WEEK_IN_MS * (numberOfWeeks - i)) +
        DAY_IN_MS,
      weekEnd: getEndOfDay(target.date - WEEK_IN_MS * (numberOfWeeks - i - 1)),
    };
  }

  return weeks;
};

const taperWeeks = (weeks, target) => {
  const dateOfTaper = target.date - target.taper;

  return weeks.map((week, i) => {
    const taperRatio = Math.max(
      0,
      Math.min(
        1,
        (week.weekEnd - dateOfTaper) / (week.weekEnd - week.weekStart)
      )
    );
    const taperAmount = 1 - taperRatio * TAPER_REDUCTION;

    return {
      ...week,
      distance: week.distance * taperAmount,
    };
  });
};

const interleaveRestWeeks = (weeks) => {
  const totalMileage = weeks.reduce((acc, cur) => acc + cur.distance, 0);

  const rawRestedWeeks = weeks.map((week, i) => {
    // ideal interleaving is NORMAL / NORMAL / TAPER
    // we taper at the end, so make sure to end on an TAPER
    const shouldRest = (i - weeks.length + 1) % 3 === 0;

    return {
      ...week,
      distance: week.distance * (shouldRest ? 0.8 : 1),
    };
  });

  const rawRestedMileage = rawRestedWeeks.reduce(
    (acc, cur) => acc + cur.distance,
    0
  );

  const adjustment = totalMileage / rawRestedMileage; // adjust so we still do the same overall mileage

  const restedWeeks = rawRestedWeeks.map((week) => ({
    ...week,
    distance: week.distance * adjustment,
  }));

  return restedWeeks;
};

const addMovingTimeToWeeks = (weeks) =>
  weeks.map((week) => ({
    ...week,
    movingTime: week.pace * week.distance,
  }));

const getSuggestedPlanForWeek = (week, trainingPrefs, target) => {
  const distanceWeights = Object.values(trainingPrefs)
    .filter(Boolean)
    .map((runType) => PREF_MAP[runType].distanceWeight)
    .reduce((acc, cur) => acc + cur, 0);

  const distancePlan = Object.keys(trainingPrefs).reduce((acc, cur) => {
    const runType = trainingPrefs[cur];
    const runPrefs = PREF_MAP[runType];

    if (!runType) return acc;

    const weekWithDistance = {
      ...acc,
      [cur]: {
        distance: (week.distance * runPrefs.distanceWeight) / distanceWeights,
        date: week.weekStart + DAY_IN_MS * cur,
        runType,
      },
    };

    if (runPrefs.targetPace) {
      weekWithDistance[cur].movingTime =
        (target.movingTime * weekWithDistance[cur].distance) / target.distance;
      weekWithDistance[cur].pace =
        weekWithDistance[cur].movingTime / weekWithDistance[cur].distance;
    }

    return weekWithDistance;
  }, {});

  const movingTimeSoFar = Object.values(distancePlan).reduce(
    (acc, cur) => acc + cur.movingTime || 0,
    0
  );
  const remainingMovingTime = week.movingTime - movingTimeSoFar;
  const unassignedDistance = Object.values(distancePlan).reduce(
    (acc, cur) => acc + (cur.movingTime ? 0 : cur.distance),
    0
  );

  const finalPlan = Object.keys(distancePlan).reduce((acc, cur) => {
    const curPlan = { ...distancePlan[cur] };

    if (!curPlan.movingTime) {
      curPlan.movingTime =
        (remainingMovingTime * curPlan.distance) / unassignedDistance;
      curPlan.pace = curPlan.movingTime / curPlan.distance;
    }

    return {
      ...acc,
      [cur]: curPlan,
    };
  }, {});

  return finalPlan;
};

const getActivityMatchProbability = (activity1, activity2) => {
  const day1 = (new Date(activity1.date).getDay() + 6) % 7; // get the days such that Sunday is far away from Monday
  const day2 = (new Date(activity2.date).getDay() + 6) % 7;
  const daySpread = Math.abs(day1 - day2);
  const dayProbability = daySpread === 0 ? 1 : daySpread / 7;

  const distance1 = activity1.distance;
  const distance2 = activity2.distance;
  const distanceProbability =
    Math.min(distance1, distance2) / Math.max(distance1, distance2);

  return dayProbability * dayProbability * distanceProbability;
};

const getPlanWithActivityGuesses = (suggestedPlan, activitiesOfWeek) => {
  const planKeys = Object.keys(suggestedPlan);
  const planWithActivityProbabilities = planKeys.reduce(
    (acc, cur) => ({
      ...acc,
      [cur]: {
        ...suggestedPlan[cur],
        probabilities: activitiesOfWeek.map((activity) =>
          getActivityMatchProbability(activity, suggestedPlan[cur])
        ),
      },
    }),
    {}
  );

  // make sure that we get all the activities permutated, but filled with nulls
  // if there are less activities than there are plan entries
  const activityKeys = Object.keys(activitiesOfWeek)
    .concat(new Array(planKeys.length).fill(null))
    .slice(0, Math.max(activitiesOfWeek.length, planKeys.length));

  const attributionVariations = permutator(activityKeys);
  const summedProbabilities = attributionVariations.map((orders) => {
    const sum = Object.values(planWithActivityProbabilities).reduce(
      (acc, plan, i) => {
        return acc + (plan.probabilities[orders[i]] || 0);
      },
      0
    );
    return sum;
  });

  let maxProbability;
  let attributions;
  summedProbabilities.forEach((sum, i) => {
    if (!maxProbability || sum > maxProbability) {
      maxProbability = sum;
      attributions = attributionVariations[i];
    }
  });

  // plan 0 (a0, a1)     1
  // plan 1 (a0, a1)     0
  // plan 2 (a0, a1)     NULL
  // SO
  // for plan 0, we look at attributions[0], which is 1 so a1
  // for plan i, we look at attributions[i], so activities[attributions[i]]

  const planWithActivityGuesses = planKeys.reduce((acc, cur, i) => {
    const plan = {
      ...acc,
      [cur]: { ...suggestedPlan[cur] },
    };

    const activity = activitiesOfWeek[attributions[i]];
    if (activity) {
      plan[cur].activity = activity;
      plan[cur].activity.probability =
        planWithActivityProbabilities[cur].probabilities[attributions[i]];
    }

    return plan;
  }, {});

  return planWithActivityGuesses;
};

const weekPlanPast = (activitiesOfWeek, totalActivities) => {
  return {
    ...week,
    activitiesOfWeek,
    totalActivities,
  };
};

const weekPlanCurrent = (
  week,
  activitiesOfWeek,
  totalActivities,
  trainingPrefs,
  target
) => {
  const suggestedPlan = getSuggestedPlanForWeek(week, trainingPrefs, target);
  const planWithActivityGuesses = getPlanWithActivityGuesses(
    suggestedPlan,
    activitiesOfWeek
  );

  const remaining = {
    distance: Math.max(0, week.distance - totalActivities.distance),
    movingTime: Math.max(0, week.movingTime - totalActivities.movingTime),
  };

  const amendedWeek = {
    ...week,
    distance: remaining.distance,
    movingTime: remaining.movingTime,
    pace: remaining.movingTime / remaining.distance,
  };
  const amendedPrefs = Object.keys(trainingPrefs).reduce(
    (acc, cur) => ({
      ...acc,
      [cur]:
        planWithActivityGuesses[cur] && planWithActivityGuesses[cur].activity
          ? null
          : trainingPrefs[cur],
    }),
    {}
  );
  const amendedPlan = getSuggestedPlanForWeek(
    amendedWeek,
    amendedPrefs,
    target
  );

  return {
    ...week,
    activitiesOfWeek,
    plan: amendedPlan,
  };
};

const weekPlanFuture = (week, trainingPrefs) => {
  return {
    ...week,
    plan: getSuggestedPlanForWeek(week, trainingPrefs, target),
  };
};

const getRenderableWeek = (
  week,
  sinceTrainingPlanActivities,
  trainingPrefs,
  target
) => {
  const start = new Date(week.weekStart);
  const end = new Date(week.weekEnd);

  const activitiesOfWeek = sinceTrainingPlanActivities.filter(
    (activity) => week.weekStart < activity.date && activity.date < week.weekEnd
  );

  const totalActivities = activitiesOfWeek.reduce(
    (acc, cur) => ({
      distance: acc.distance + cur.distance,
      movingTime: acc.movingTime + cur.movingTime,
    }),
    { distance: 0, movingTime: 0 }
  );

  if (end < Date.now()) {
    return weekPlanPast(activitiesOfWeek, totalActivities);
  } else if (start > Date.now()) {
    return weekPlanFuture(week, trainingPrefs);
  } else {
    return weekPlanCurrent(
      week,
      activitiesOfWeek,
      totalActivities,
      trainingPrefs,
      target
    );
  }
};

export const generateWeeksPlan = (
  target,
  trainingPrefs,
  targetPeak,
  potential,
  sinceTrainingPlanActivities
) => {
  const { distanceInc, speedInc } = getWeeklyIncs(
    potential,
    targetPeak,
    target
  );

  const rawWeeks = getRawWeeks(target, targetPeak, distanceInc, speedInc);
  const weeks = addMovingTimeToWeeks(
    taperWeeks(interleaveRestWeeks(rawWeeks), target)
  );
  const renderableWeeks = weeks.map((week) =>
    getRenderableWeek(week, sinceTrainingPlanActivities, trainingPrefs, target)
  );

  return renderableWeeks;
};
