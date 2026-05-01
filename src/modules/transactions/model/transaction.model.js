import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["deposit", "withdraw"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "rejected"],
      default: "pending",
    },
    method: {
      type: String,
      default: "bank_transfer", // e.g. "bank_transfer", "qr_code"
    },
    proofUrl: {
      type: String,
      default: null,
    },
    note: {
      type: String,
      default: "",
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for client-initiated
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export { Transaction };
