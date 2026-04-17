const { app } = require("./app");
const { connectDatabase } = require("./config/database");
const { mongoUri, port } = require("./config/env");
const { logger } = require("./config/logger");

const startServer = async () => {
  await connectDatabase(mongoUri);
  app.listen(port, () => {
    logger.info({ port }, "API server listening");
  });
};

startServer().catch((error) => {
  logger.error({ err: error }, "Failed to start server");
  process.exit(1);
});
