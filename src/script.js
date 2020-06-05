const target = document.getElementById("target");

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

const getActivities = async (accessToken) => {
  const listResponse = await fetch(
    "https://www.strava.com/api/v3/athlete/activities",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const list = await listResponse.json();

  return list.map((activity) => {
    return {
      date: activity.start_date,
      distance: activity.distance,
      movingTime: activity.moving_time,
      isRace: activity.workout_type === 1,
    };
  });
};

const main = async () => {
  await grabAccessTokens();

  if (localStorage.getItem("accessToken")) {
    const accessToken = localStorage.getItem("accessToken");
    const activities = await getActivities(accessToken);

    target.innerHTML = JSON.stringify(activities, null, 2);
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
