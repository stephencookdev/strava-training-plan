import { advanceTo, clear } from "jest-date-mock";
import { getPeakReqs, getCurrentPotential } from "../src/runningStats";
import { generateWeeksPlan } from "../src/weekPlan";
import { parseHumanPaceKm, METERS_IN_KM } from "../src/unitsUtils";
import { DAY_IN_MS } from "../src/datesUtils";
import { renderWeekPlanHtml } from "../src/renderUtils";

const generateRun = (date, distanceKm, paceKmStr, isRace = false) => {
  const distance = distanceKm * METERS_IN_KM;
  const pace = parseHumanPaceKm(paceKmStr);
  const movingTime = distance * pace;

  return {
    date: date instanceof Date ? date : new Date(date),
    distance,
    movingTime,
    isRace,
  };
};

describe("Integration Tests", () => {
  beforeEach(() => {
    clear();
  });

  test("New plan, intermediate", () => {
    advanceTo(new Date("2018-01-01")); // Monday, January 1st

    const targetRace = {
      distance: 42195,
      movingTime: 14400000,
      trainingStartDate: Date.now(),
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
      sinceTrainingPlanActivities
    );

    expect(
      renderWeekPlanHtml({
        weeks,
        region: "en-GB",
      })
    ).toMatchSnapshot();
  });
});
