const env = require("dotenv").config();

module.exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      foo: "bar",
      env: env,
    }),
  };
};
