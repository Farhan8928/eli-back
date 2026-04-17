const pino = require("pino");
const { nodeEnv } = require("./env");
const { requestContext } = require("../middlewares/requestContextProvider");

const logger = pino({
  level: nodeEnv === "production" ? "info" : "debug",
  transport:
    nodeEnv !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  formatters: {
    level(label) {
      return { level: label };
    }
  },
  mixin() {
    const store = requestContext.getStore();
    const reqId = store?.get("reqId");
    return reqId ? { reqId } : {};
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

module.exports = { logger };