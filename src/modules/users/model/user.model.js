import mongoose from "mongoose";

const mt5AccountRefSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mt5Account",
      required: true,
    },
    login: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["demo", "live"],
      required: true,
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["client", "superadmin", "representative"],
      default: "client",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processing", "disabled"],
      default: "pending",
      index: true,
    },
    kycStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    phone: String,
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
      youtube: String,
    },
    bankDetails: {
      accountName: String,
      bankName: String,
      accountNumber: String,
      ifsc: String,
      branchName: String,
    },
    mt5Accounts: {
      type: [mt5AccountRefSchema],
      default: [],
    },
    referralBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const User = mongoose.model("User", userSchema);

export { User };
