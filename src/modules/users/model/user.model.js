const mongoose = require("mongoose");

const mt5AccountRefSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mt5Account",
      required: true
    },
    login: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ["demo", "live"],
      required: true
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["client", "superadmin"],
      default: "client",
      index: true
    },
    kycStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    mt5Accounts: {
      type: [mt5AccountRefSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };