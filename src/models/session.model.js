import mongoose from "mongoose";

const sessionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "userModel is Required"],
    },
    refreshTokenHash: {
      type: String,
      required: [true, "Refresh token hash is required"],
    },
    ip: {
      type: String,
      required: [true, "IP address is required"],
    },
    userAgent: {
      type: String,
      required: [true, "userModel Agent is required"],
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const sessionModel = mongoose.model("sessions", sessionSchema);
