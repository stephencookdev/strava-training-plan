export const grabAccessTokens = async () => {
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

export const getActivities = async (accessToken, { before, after } = {}) => {
  const queryParams = [];
  if (before) queryParams.push(`before=${Math.floor(before / 1000)}`);
  if (after) queryParams.push(`after=${Math.floor(after / 1000)}`);

  if (after && after > new Date()) {
    // Strava API doesn't allow future `after` dates
    return [];
  }

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
