const target = document.getElementById("target");

const RACE_WEIGHT = 100;
const DAYS_TO_ZERO_WEIGHTING = 7 * 6; // (6 weeks)
const TAPER_REDUCTION = 0.65;
const INITIAL_JUMP = 0.15;

const REGION = "en-GB";

const MINUTE_IN_MS = 1000 * 60;
const DAY_IN_MS = MINUTE_IN_MS * 60 * 24;
const WEEK_IN_MS = DAY_IN_MS * 7;

const TARGET_RACE = {
  distance: 42195,
  movingTime: 14400,
  trainingStartDate: new Date("2020-05-11"),
  date: new Date("2020-09-13Z09:00"),
  taper: 18 * DAY_IN_MS,
};

const TRAINING_PREFS = {
  0: null, // Monday
  1: "speed", // Tuesday
  2: "recovery", // Wednesday
  3: null, // Thursday
  4: "recovery", // Friday,
  5: null, // Saturday
  6: "long", // Sunday
};

const PREF_MAP = {
  speed: { distanceWeight: 1.1 },
  recovery: { distanceWeight: 1 },
  long: { distanceWeight: 3, targetPace: true },
};

const DAY_MAP = {
  0: "Monday",
  1: "Tuesday",
  2: "Wednesday",
  3: "Thursday",
  4: "Friday",
  5: "Saturday",
  6: "Sunday",
};

const Riegel = {
  R: 1.15,
  getNewTime(newDistance, old) {
    return old.movingTime * Math.pow(newDistance / old.distance, Riegel.R);
  },
  getNewDistance(newTime, old) {
    return old.distance * Math.pow(newTime / old.movingTime, 1 / Riegel.R);
  },
};

const grabAccessTokens = async () => {
  const queryParams = new URLSearchParams(location.search);
  const authCode = queryParams.get("code");

  if (!authCode) return;

  const authResult = await fetch("/.netlify/functions/auth", {
    method: "POST",
    body: authCode,
  });
  const authResultJson = await authResult.json();

  if (authResultJson.accessToken) {
    window.history.replaceState({}, document.title, "/");

    localStorage.setItem("accessToken", authResultJson.accessToken);
    localStorage.setItem("refreshToken", authResultJson.refreshToken);
  }
};

const getActivities = async (accessToken, { before, after } = {}) => {
  const queryParams = [];
  if (before) queryParams.push(`before=${Math.floor(before / 1000)}`);
  if (after) queryParams.push(`after=${Math.floor(after / 1000)}`);

  const listResponse = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?${queryParams.join("&")}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const list = await listResponse.json();

  return list.map((activity) => {
    return {
      date: new Date(activity.start_date),
      distance: activity.distance,
      movingTime: activity.moving_time,
      isRace: activity.workout_type === 1,
    };
  });
};

const getTimeWeighting = (activity) => {
  const date = activity.date;
  const ZERO_THRESHOLD = DAY_IN_MS * DAYS_TO_ZERO_WEIGHTING;
  const timeOfZero = TARGET_RACE.trainingStartDate - ZERO_THRESHOLD;

  const t = Math.max(0, Math.min(1, (date - timeOfZero) / ZERO_THRESHOLD));

  return t * t;
};

const getRaceWeighting = (activity) => {
  return activity.isRace ? RACE_WEIGHT : 1;
};

const getCurrentPotential = (activities) => {
  const cookedActivities = activities.map((activity) => ({
    ...activity,
    weight: getTimeWeighting(activity) * getRaceWeighting(activity),
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
    weeklyMileage: getWeeklyMileage(activities),
  };

  return potential;
};

const getWeeklyMileage = (activities) => {
  const sortedActivities = activities.sort((a, b) => a.date - b.date);
  const earliestActivity = sortedActivities[0];
  const latestActivity = sortedActivities[sortedActivities.length - 1];

  const ONE_DAY = 1000 * 60 * 60 * 24;
  const daysBetween = Math.ceil(
    (latestActivity.date - earliestActivity.date) / ONE_DAY
  );
  let dayWeightingSum = 0;
  for (let i = 0; i <= daysBetween; i++) {
    dayWeightingSum += getTimeWeighting({
      date: TARGET_RACE.trainingStartDate - ONE_DAY * i,
    });
  }

  const summedMileage = activities.reduce(
    (acc, cur) => acc + cur.distance * getTimeWeighting(cur),
    0
  );

  return (7 * summedMileage) / dayWeightingSum;
};

const humanDistance = (distance) => {
  const distanceKm = distance / 1000;
  return `${distanceKm.toFixed(1)}km`;
};

const humanPace = (movingTime, distance) => {
  const secondMeterPace = movingTime / distance;
  const minuteKmPace = (1000 * secondMeterPace) / 60;

  const minuteKmPaceWhole = Math.floor(minuteKmPace);
  const minuteKmPaceSeconds = Math.floor(
    (minuteKmPace - minuteKmPaceWhole) * 60
  )
    .toString()
    .padStart(2, "0");

  const cookedMinuteKmPace = `${minuteKmPaceWhole}:${minuteKmPaceSeconds}`;

  return cookedMinuteKmPace;
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

const getPeakReqs = (target) => {
  const peakDistance = 2 * target.distance;

  const targetSecondMeterPace = TARGET_RACE.movingTime / TARGET_RACE.distance;
  const targetMinuteKmPace = (1000 * targetSecondMeterPace) / 60;
  const peakMinuteKmPace = targetMinuteKmPace + 0.4;
  const peakSecondMeterPace = (60 * peakMinuteKmPace) / 1000;

  return { distance: peakDistance, pace: peakSecondMeterPace };
};

const getStartOfDay = (date) => {
  return Math.floor(date / DAY_IN_MS) * DAY_IN_MS + 1;
};

const getEndOfDay = (date) => {
  return Math.ceil(date / DAY_IN_MS) * DAY_IN_MS - 1;
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

const taperWeeks = (weeks, taper) => {
  const dateOfTaper = TARGET_RACE.date - taper;

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

const weekActivitiesSoFar = (activitiesOfWeek) => {
  return activitiesOfWeek
    .map((activity) => ` - ${humanActivity(activity)}`)
    .join("\n");
};

const getSuggestedPlanForWeek = (week) => {
  const distanceWeights = Object.values(TRAINING_PREFS)
    .filter(Boolean)
    .map((runType) => PREF_MAP[runType].distanceWeight)
    .reduce((acc, cur) => acc + cur, 0);

  const distancePlan = Object.keys(TRAINING_PREFS).reduce((acc, cur) => {
    const runType = TRAINING_PREFS[cur];
    const runPrefs = PREF_MAP[runType];

    if (!runType) return acc;

    const weekWithDistance = {
      ...acc,
      [cur]: {
        distance: (week.distance * runPrefs.distanceWeight) / distanceWeights,
        runType,
      },
    };

    if (runPrefs.targetPace) {
      weekWithDistance[cur].movingTime =
        (TARGET_RACE.movingTime * weekWithDistance[cur].distance) /
        TARGET_RACE.distance;
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

const weekPlanPast = (activitiesOfWeek, totalActivities) => {
  const activitiesString = weekActivitiesSoFar(activitiesOfWeek);

  return activitiesString + "\n" + `(total ${humanActivity(totalActivities)})`;
};

const weekPlanCurrent = (week, activitiesOfWeek, totalActivities) => {
  const remaining = {
    distance: Math.max(0, week.distance - totalActivities.distance),
    movingTime: Math.max(0, week.movingTime - totalActivities.movingTime),
  };

  const recommendedRemaining = `Recommended this week: ${humanActivity(
    remaining
  )}`;

  return weekActivitiesSoFar(activitiesOfWeek) + "\n" + recommendedRemaining;
};

const weekPlanFuture = (week, activitiesOfWeek, totalActivities) => {
  const suggestedPlan = getSuggestedPlanForWeek(week);

  const suggestedString = Object.keys(suggestedPlan)
    .map(
      (dayKey) => `${DAY_MAP[dayKey]}: ${humanActivity(suggestedPlan[dayKey])}`
    )
    .join("\n");

  return suggestedString;
};

const weekPlanString = (week, sinceTrainingPlanActivities) => {
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
    return weekPlanFuture(week, activitiesOfWeek, totalActivities);
  } else {
    return weekPlanCurrent(week, activitiesOfWeek, totalActivities);
  }
};

const main = async () => {
  await grabAccessTokens();

  if (localStorage.getItem("accessToken")) {
    const accessToken = localStorage.getItem("accessToken");
    const historicalActivities = await getActivities(accessToken, {
      before: TARGET_RACE.trainingStartDate,
    });
    const sinceTrainingPlanActivities = await getActivities(accessToken, {
      after: TARGET_RACE.trainingStartDate,
    });

    const potential = getCurrentPotential(historicalActivities);

    const riegelRacePrediction = {
      timeAtRaceDistance: Riegel.getNewTime(TARGET_RACE.distance, potential),
      distanceAtRacePace: Riegel.getNewDistance(
        TARGET_RACE.movingTime,
        potential
      ),
    };

    const targetPeak = getPeakReqs(TARGET_RACE);
    const msUntilRaceFromTrainingStart =
      TARGET_RACE.date - TARGET_RACE.trainingStartDate;

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

    const rawWeeks = getRawWeeks(
      TARGET_RACE,
      targetPeak,
      distanceInc,
      speedInc
    );
    const weeks = addMovingTimeToWeeks(
      taperWeeks(interleaveRestWeeks(rawWeeks), TARGET_RACE.taper)
    );

    target.innerHTML = `
      Potential: distance ${humanDistance(potential.distance)} / ${humanPace(
      potential.movingTime,
      potential.distance
    )} pace
      Weekly mileage: ${humanDistance(potential.weeklyMileage)}
      
      Target pace: ${humanPace(TARGET_RACE.movingTime, TARGET_RACE.distance)}
      Target distance: ${humanDistance(TARGET_RACE.distance)}
      Riegel pace @ race distance: ${humanPace(
        riegelRacePrediction.timeAtRaceDistance,
        TARGET_RACE.distance
      )}
      Riegel distance @ race pace: ${humanDistance(
        riegelRacePrediction.distanceAtRacePace
      )}

      Distance INC: ${distanceInc.toFixed(2)}
      Speed INC: ${speedInc.toFixed(2)}

      Weeks:
${weeks
  .map((week) => {
    const start = new Date(week.weekStart);
    const dateF = new Intl.DateTimeFormat(REGION, {
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
  .join("\n\n")}
    `;

    target.style = "white-space: pre;";
  } else {
    const button = document.createElement("a");
    const currentUrl = location.toString();
    button.setAttribute(
      "href",
      `http://www.strava.com/oauth/authorize?client_id=${
        import.meta.env.SNOWPACK_PUBLIC_CLIENT_ID
      }&response_type=code&redirect_uri=${encodeURIComponent(
        currentUrl
      )}&approval_prompt=force&scope=activity:read_all`
    );
    button.innerText = "Authorise";
    button.addEventListener("click", () => {});

    target.appendChild(button);
  }
};

main();
