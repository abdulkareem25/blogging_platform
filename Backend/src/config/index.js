import "./env.js";

const required = (name) => {
  const value = process.env[name];

  if (!value && process.env.NODE_ENV !== "test") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const config = Object.freeze({
  nodeEnv: required("NODE_ENV"),
  port: Number(required("PORT")),
  corsOrigin: required("CORS_ORIGIN"),
  mongodbUri: required("MONGODB_URI"),
  accessTokenSecret: required("ACCESS_TOKEN_SECRET"),
  accessTokenExpiry: required("ACCESS_TOKEN_EXPIRY"),
  refreshTokenSecret: required("REFRESH_TOKEN_SECRET"),
  refreshTokenExpiry: required("REFRESH_TOKEN_EXPIRY"),
  adminUsername: required("ADMIN_USERNAME"),
  adminEmail: required("ADMIN_EMAIL"),
  adminPassword: required("ADMIN_PASSWORD")
});

export default config;
