import { getActivities, grabAccessTokens } from "./stravaApi";
import { renderWeekPlanHtml, renderMetaStatsHtml } from "./renderUtils";
import { DAY_IN_MS } from "./datesUtils";
import { getCurrentPotential, getPeakReqs, Riegel } from "./runningStats";
import { generateWeeksPlan } from "./weekPlan";

const target = document.getElementById("target");

const REGION = "en-GB";

const TARGET_RACE = {
  distance: 42195,
  movingTime: 14400,
  trainingStartDate: new Date("2020-12-28"),
  date: new Date("2021-03-21Z09:00"),
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
      target: TARGET_RACE,
      riegelRacePrediction,
      targetPeak,
    });
    const weekPlanHtml = renderWeekPlanHtml({
      weeks,
      region: REGION,
    });

    target.innerHTML = metaStatsHtml + "\n\n" + weekPlanHtml;
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
