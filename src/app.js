import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { clientOrigin, nodeEnv } from "./config/env.js";
import { logger } from "./config/logger.js";
import { router as apiRouter } from "./routes/index.js";
import { notFound } from "./common/middleware/notFound.middleware.js";
import { errorHandler } from "./common/errors/errorHandler.js";
import { requestContextProvider } from "./middlewares/requestContextProvider.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(requestContextProvider);
app.use(pinoHttp({ logger, autoLogging: true, genReqId: (req) => req.id }));
app.use(compression());
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    maxAge: nodeEnv === "production" ? "1d" : 0,
  }),
);
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1", apiRouter);
app.use(notFound);
app.use(errorHandler);

export { app };
