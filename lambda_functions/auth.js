const axios = require("axios");

module.exports.handler = async (event, context) => {
  const authCode = event.body;

  const authResponse = await axios.post("https://www.strava.com/oauth/token", {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    code: authCode,
    grant_type: "authorization_code",
  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accessToken: authResponse.data.access_token,
      refreshToken: authResponse.data.refresh_token,
    }),
  };
};
