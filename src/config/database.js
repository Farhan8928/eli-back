const mongoose = require("mongoose");

const connectDatabase = async (mongoUri) => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000
  });
};

module.exports = { connectDatabase };