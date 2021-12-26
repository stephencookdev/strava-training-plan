import { advanceTo, clear } from "jest-date-mock";
import { getPeakReqs, getCurrentPotential } from "../src/runningStats";
import { generateWeeksPlan } from "../src/weekPlan";
import { parseHumanPaceKm, KM_IN_METERS } from "../src/unitsUtils";
import { DAY_IN_MS } from "../src/datesUtils";
import { renderWeekPlanHtml } from "../src/renderUtils";

const generateRun = (date, distanceKm, paceKmStr, isRace = false) => {
  const distance = distanceKm * KM_IN_METERS;
  const pace = parseHumanPaceKm(paceKmStr);
  const movingTime = distance * pace;

  date = date instanceof Date ? date : new Date(date);
  date.setHours(8);

  return {
    date,
    distance,
    movingTime,
    isRace,
  };
};

describe("Integration Tests", () => {
  beforeEach(() => {
    clear();
  });

  test("New plan, marathon, intermediate", () => {
    advanceTo(new Date("2018-01-01")); // 2018 has Monday, January 1st

    const targetRace = {
      distance: 42195,
      movingTime: 14400000,
      trainingStartDate: new Date("2018-01-01"),
      date: new Date("2018-03-25Z09:00"),
      taper: 12 * DAY_IN_MS,
    };
    const trainingPrefs = {
      0: null, // Monday
      1: "speed", // Tuesday
      2: "recovery", // Wednesday
      3: "recovery", // Thursday
      4: null, // Friday,
      5: null, // Saturday
      6: "long", // Sunday
    };
    const historicalActivities = [
      generateRun("2017-12-25", 5, "6:30"),
      generateRun("2017-12-27", 5, "5:00"),
      generateRun("2017-12-27", 5, "6:30"),
      generateRun("2017-12-31", 12, "5:45"),
    ];
    const sinceTrainingPlanActivities = [];

    const targetPeak = getPeakReqs(targetRace);
    const potential = getCurrentPotential(historicalActivities, targetRace);

    const weeks = generateWeeksPlan(
      targetRace,
      trainingPrefs,
      targetPeak,
      potential,
      sinceTrainingPlanActivities,
      Date.now()
    );

    expect(
      renderWeekPlanHtml({
        weeks,
        region: "en-GB",
      })
    ).toMatchSnapshot();
  });

  test("Half way through accurate week, marathon, intermediate", () => {
    advanceTo(new Date("2018-01-11")); // 2018 has Monday, January 1st

    const targetRace = {
      distance: 42195,
      movingTime: 14400000,
      trainingStartDate: new Date("2018-01-01"),
      date: new Date("2018-03-25Z09:00"),
      taper: 12 * DAY_IN_MS,
    };
    const trainingPrefs = {
      0: null, // Monday
      1: "speed", // Tuesday
      2: "recovery", // Wednesday
      3: "recovery", // Thursday
      4: null, // Friday,
      5: null, // Saturday
      6: "long", // Sunday
    };
    const historicalActivities = [
      generateRun("2017-12-25", 5, "6:30"),
      generateRun("2017-12-27", 5, "5:00"),
      generateRun("2017-12-27", 5, "6:30"),
      generateRun("2017-12-31", 12, "5:45"),
    ];
    const sinceTrainingPlanActivities = [
      generateRun("2018-01-02", 6.7, "6:04"),
      generateRun("2018-01-03", 6.1, "6:04"),
      generateRun("2018-01-04", 6.1, "6:04"),
      generateRun("2018-01-07", 18.3, "5:41"),

      generateRun("2018-01-09", 7.3, "6:04"),
      generateRun("2018-01-10", 6.6, "6:04"),
    ];

    const targetPeak = getPeakReqs(targetRace);
    const potential = getCurrentPotential(historicalActivities, targetRace);

    const weeks = generateWeeksPlan(
      targetRace,
      trainingPrefs,
      targetPeak,
      potential,
      sinceTrainingPlanActivities,
      Date.now()
    );

    expect(
      renderWeekPlanHtml({
        weeks,
        region: "en-GB",
      })
    ).toMatchSnapshot();
  });

  test("Half way through week, long run on different day, marathon, intermediate", () => {
    advanceTo(new Date("2018-01-11")); // 2018 has Monday, January 1st

    const targetRace = {
      distance: 42195,
      movingTime: 14400000,
      trainingStartDate: new Date("2018-01-01"),
      date: new Date("2018-03-25Z09:00"),
      taper: 12 * DAY_IN_MS,
    };
    const trainingPrefs = {
      0: null, // Monday
      1: "speed", // Tuesday
      2: "recovery", // Wednesday
      3: "recovery", // Thursday
      4: null, // Friday,
      5: null, // Saturday
      6: "long", // Sunday
    };
    const historicalActivities = [
      generateRun("2017-12-25", 5, "6:30"),
      generateRun("2017-12-27", 5, "5:00"),
      generateRun("2017-12-27", 5, "6:30"),
      generateRun("2017-12-31", 12, "5:45"),
    ];
    const sinceTrainingPlanActivities = [
      generateRun("2018-01-02", 6.7, "6:04"),
      generateRun("2018-01-03", 6.1, "6:04"),
      generateRun("2018-01-04", 6.1, "6:04"),
      generateRun("2018-01-07", 18.3, "5:41"),

      generateRun("2018-01-09", 7.3, "6:04"),
      generateRun("2018-01-10", 19.8, "5:41"),
    ];

    const targetPeak = getPeakReqs(targetRace);
    const potential = getCurrentPotential(historicalActivities, targetRace);

    const weeks = generateWeeksPlan(
      targetRace,
      trainingPrefs,
      targetPeak,
      potential,
      sinceTrainingPlanActivities,
      Date.now()
    );

    expect(
      renderWeekPlanHtml({
        weeks,
        region: "en-GB",
      })
    ).toMatchSnapshot();
  });
});
