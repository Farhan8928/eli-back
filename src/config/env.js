import dotenv from "dotenv";

dotenv.config();

/** When false, MT5 API calls are skipped; clients request accounts via email instead. */
export const mt5AutomationEnabled =
  process.env.MT5_AUTOMATION_ENABLED !== "false";

/** Shown in API errors and the client portal when automation is off. */
export const mt5SupportEmail = process.env.MT5_SUPPORT_EMAIL || "";

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
if (mt5AutomationEnabled) {
  requiredEnv.push("MT5_SERVICE_BASE_URL");
}

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
export const clientOrigin =
  process.env.CLIENT_ORIGIN || "http://localhost:5173";

/** Dummy base URL when automation is off so axios is never used with undefined. */
export const mt5ServiceBaseUrl = mt5AutomationEnabled
  ? process.env.MT5_SERVICE_BASE_URL
  : process.env.MT5_SERVICE_BASE_URL || "http://127.0.0.1:0";

export const mt5ServiceApiKey = process.env.MT5_SERVICE_API_KEY || "";
export const mt5Login = process.env.MT5_LOGIN || "";
export const mt5Password = process.env.MT5_PASSWORD || "";
export const mt5Server = process.env.MT5_SERVER || "";

/** Max KYC upload size (GridFS). Default 3 MiB to stay friendly to Atlas free tier. */
export const kycMaxFileBytes = Number(
  process.env.KYC_MAX_FILE_BYTES || 3 * 1024 * 1024,
);
