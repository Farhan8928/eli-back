import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["MONGO_URI", "JWT_SECRET", "MT5_SERVICE_BASE_URL"];

requiredEnv.forEach((name) => {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
});

export const nodeEnv = process.env.NODE_ENV || "development";
export const port = Number(process.env.PORT || 5000);
export const mongoUri = process.env.MONGO_URI;
export const jwtSecret = process.env.JWT_SECRET;
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1d";
export const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
export const mt5ServiceBaseUrl = process.env.MT5_SERVICE_BASE_URL;
export const mt5ServiceApiKey = process.env.MT5_SERVICE_API_KEY || "";
export const mt5Login = process.env.MT5_LOGIN || "";
export const mt5Password = process.env.MT5_PASSWORD || "";
export const mt5Server = process.env.MT5_SERVER || "";

