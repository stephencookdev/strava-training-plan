import React, { useState, useEffect, createContext } from "react";
import LoginButton from "../LoginButton";
import LegacyApp from "../LegacyApp";
import { grabAccessTokens } from "../../stravaApi";
import { DAY_IN_MS } from "../../datesUtils";

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

const TODAY = 1629467200001;

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

export const AppContext = createContext("app");

const App = () => {
  const { accessToken, loading } = useAuth();

  if (loading) return "Loading...";
  if (!accessToken) return <LoginButton />;

  return (
    <AppContext.Provider
      value={{
        region: REGION,
        targetRace: TARGET_RACE,
        trainingPrefs: TRAINING_PREFS,
        today: TODAY,
      }}
    >
      <LegacyApp accessToken={accessToken} />
    </AppContext.Provider>
  );
};

export default App;
