const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pinoHttp = require("pino-http");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { clientOrigin } = require("./config/env");
const { logger } = require("./config/logger");
const { router: apiRouter } = require("./routes");
const { notFound } = require("./common/middleware/notFound.middleware");
const { errorHandler } = require("./common/errors/errorHandler");
const {
  requestContextProvider,
} = require("./middlewares/requestContextProvider");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
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

module.exports = { app };
