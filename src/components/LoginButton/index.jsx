import React from "react";

const LoginButton = () => {
  const currentUrl = location.toString();

  return (
    <a
      href={`http://www.strava.com/oauth/authorize?client_id=${
        import.meta.env.SNOWPACK_PUBLIC_CLIENT_ID
      }&response_type=code&redirect_uri=${encodeURIComponent(
        currentUrl
      )}&approval_prompt=force&scope=activity:read_all`}
    >
      Authorize
    </a>
  );
};

export default LoginButton;
