import mongoose from "mongoose";

const smtpConfigSchema = new mongoose.Schema(
  {
    server: {
      type: String,
      required: true,
      trim: true,
    },
    port: {
      type: Number,
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    ssl: {
      type: Boolean,
      default: true,
    },
    timeoutMs: {
      type: Number,
      default: 5000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const SmtpConfig = mongoose.model("SmtpConfig", smtpConfigSchema);

export { SmtpConfig };
