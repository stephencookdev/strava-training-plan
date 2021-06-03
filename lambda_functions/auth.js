const axios = require("axios");

module.exports.handler = async (event, context) => {
  const { authCode, refreshToken } = event.body;

  const authResponse = await axios.post("https://www.strava.com/oauth/token", {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: authCode ? "authorization_code" : "refresh_token",
    ...(authCode ? { code: authCode } : { refresh_token: refreshToken }),
  });

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
