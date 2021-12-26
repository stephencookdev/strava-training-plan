import React, { useState, useEffect, createContext } from "react";
import LoginButton from "../LoginButton";
import LegacyApp from "../LegacyApp";
import { getActivities, grabAccessTokens } from "../../stravaApi";
import { DAY_IN_MS, MINUTE_IN_MS } from "../../datesUtils";

const REGION = "en-GB";

const TARGET_RACE = {
  distance: 42195,
  movingTime: 14400000,
  trainingStartDate: new Date("2021-06-07"),
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

const TODAY = new Date("2021-06-21");

const useAuth = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await grabAccessTokens();

      const newAccessToken = localStorage.getItem("accessToken");
      if (newAccessToken) {
        setAccessToken(newAccessToken);
      }

      setLoading(false);
    })();
  }, []);

  return { accessToken, loading };
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

export const AppContext = createContext("app");

const InnerApp = ({ accessToken }) => {
  const historicalActivities = useActivities(accessToken, {
    before: TARGET_RACE.trainingStartDate,
  });
  const sinceTrainingPlanActivities = useActivities(accessToken, {
    after: TARGET_RACE.trainingStartDate,
  });

  if (!historicalActivities || !sinceTrainingPlanActivities) {
    return "Loading...";
  }

  const context = {
    region: REGION,
    targetRace: TARGET_RACE,
    trainingPrefs: TRAINING_PREFS,
    today: TODAY,
    historicalActivities,
    sinceTrainingPlanActivities,
  };

  return (
    <AppContext.Provider value={context}>
      <LegacyApp />
    </AppContext.Provider>
  );
};

const App = () => {
  const { accessToken, loading } = useAuth();

  if (loading) return "Loading...";
  if (!accessToken) return <LoginButton />;

  return <InnerApp accessToken={accessToken} />;
};

export default App;
