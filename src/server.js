const { app } = require("./app");
const { connectDatabase } = require("./config/database");
const { mongoUri, port } = require("./config/env");

const startServer = async () => {
  await connectDatabase(mongoUri);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API server listening on port ${port}`);
  });
};

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", error);
  process.exit(1);
});