const target = document.getElementById("target");

const grabAccessTokens = async () => {
  const queryParams = new URLSearchParams(location.search);
  const authCode = queryParams.get("code");

  if (!authCode) return;

  const authResult = await fetch("/.netlify/auth", { body: authCode });
  const authResultJson = await authResult.json();

  if (authResultJson.accessToken) {
    localStorage.setItem("accessToken", authResultJson.accessToken);
    localStorage.setItem("refreshToken", authResultJson.refreshToken);
  }
};

const main = async () => {
  await grabAccessTokens();

  if (localStorage.getItem("accessToken")) {
    target.innerHTML = localStorage.getItem("accessToken");
  } else {
    const button = document.createElement("a");
    const currentUrl = location.toString();
    button.setAttribute(
      "href",
      `http://www.strava.com/oauth/authorize?client_id=${
        import.meta.env.SNOWPACK_PUBLIC_CLIENT_ID
      }&response_type=code&redirect_uri=${encodeURI(
        currentUrl
      )}&approval_prompt=force&scope=activity:read_all`
    );
    button.innerText = "Authorise";
    button.addEventListener("click", () => {});

    target.appendChild(button);
  }
};

main();
