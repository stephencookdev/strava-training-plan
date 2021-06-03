const axios = require("axios");

module.exports.handler = async (event, context) => {
  const { authCode, refreshToken } = JSON.parse(event.body);

  let authResponse;
  try {
    authResponse = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: authCode ? "authorization_code" : "refresh_token",
      ...(authCode ? { code: authCode } : { refresh_token: refreshToken }),
    });
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accessToken: authResponse.data.access_token,
      refreshToken: authResponse.data.refresh_token,
      accessTokenExpiresAt: authResponse.data.expires_at,
    }),
  };
};
