import React, { useState, useEffect } from "react";
import LoginButton from "../LoginButton";
import LegacyApp from "../LegacyApp";
import { grabAccessTokens } from "../../stravaApi";

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

const App = () => {
  const { accessToken, loading } = useAuth();

  if (loading) return "Loading...";
  if (!accessToken) return <LoginButton />;

  return <LegacyApp accessToken={accessToken} />;
};

export default App;
