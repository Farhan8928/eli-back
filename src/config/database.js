const mongoose = require("mongoose");
const { logger } = require("./logger");

const connectDatabase = async (mongoUri) => {
  mongoose.set("strictQuery", true);
  const connection = await mongoose.connect(mongoUri, {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000
  });

  logger.info(
    { host: connection.connection.host, database: connection.connection.name },
    "MongoDB connected"
  );

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("error", (error) => {
    logger.error({ err: error }, "MongoDB connection error");
  });
};

module.exports = { connectDatabase };