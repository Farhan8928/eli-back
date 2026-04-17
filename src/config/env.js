const dotenv = require("dotenv");

dotenv.config();

const requiredEnv = ["MONGO_URI", "JWT_SECRET", "MT5_SERVICE_BASE_URL"];

requiredEnv.forEach((name) => {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mt5ServiceBaseUrl: process.env.MT5_SERVICE_BASE_URL,
  mt5ServiceApiKey: process.env.MT5_SERVICE_API_KEY || "",
  mt5Login: process.env.MT5_LOGIN || "",
  mt5Password: process.env.MT5_PASSWORD || "",
  mt5Server: process.env.MT5_SERVER || ""
};