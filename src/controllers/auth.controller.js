import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import sendEmail from "../services/email.service.js";
import { generateOtp, generateOtpHtml } from "../utils/util.js";
import otpModel from "../models/otp.model.js";

const postSignUp = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if username or email already exists
    const existingUser = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username or Email already exists",
      });
    }

    // Hash password before storing in DB
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
    });

    // Create session first so we get session._id
    const session = await sessionModel.create({
      user: user._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Create refresh token containing sessionId
    const refreshToken = jwt.sign(
      {
        id: user._id,
        sessionId: session._id,
        type: "refresh",
      },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // Store only hashed version of refresh token in DB
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    // Update session with refresh token hash
    session.refreshTokenHash = refreshTokenHash;
    await session.save();

    // Short-lived access token
    const accessToken = jwt.sign(
      {
        id: user._id,
        type: "access",
      },
      config.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    const otp = generateOtp();
    const html = generateOtpHtml(otp);
    const otpHash = await bcrypt.hash(otp, 12);

    await otpModel.create({
      email,
      user: user._id,
      otpHash,
    });

    await sendEmail(email, "OTP Verification", `Your OTP code is${otp}`, html);

    // Store refresh token in HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        username: user.username,
        email: user.email,
        verified: user.verified,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token not found",
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (decoded.type !== "access") {
      return res.status(401).json({
        message: "Access token required",
      });
    }

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      user: {
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Access token expired",
      });
    }

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

const postLogin = async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(401).json({
      message: "User is Not Registered",
    });
  }

  if (!user.verified) {
    return res.status(401).json({
      message: "Email not verified",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      message: "Incorrect Password",
    });
  }

  // Create session first so we get session._id
  const session = await sessionModel.create({
    user: user._id,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  // Create refresh token containing sessionId
  const refreshToken = jwt.sign(
    {
      id: user._id,
      sessionId: session._id,
      type: "refresh",
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  // Store only hashed version of refresh token in DB
  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

  // Update session with refresh token hash
  session.refreshTokenHash = refreshTokenHash;
  await session.save();

  // Short-lived access token
  const accessToken = jwt.sign(
    {
      id: user._id,
      type: "access",
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  // Store refresh token in HttpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, // true in production with HTTPS
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    message: "Login Successfull",
    user: {
      username: user.username,
      email: user.email,
    },
    accessToken,
  });
};

const postRefreshToken = async (req, res) => {
  // Get refresh token from cookie
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh Token not found",
    });
  }

  // Verify JWT signature and expiry
  const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

  // Ensure token is actually a refresh token
  if (decoded.type !== "refresh") {
    return res.status(401).json({
      message: "Invalid refresh token",
    });
  }

  // Find session associated with this refresh token
  const session = await sessionModel.findById(decoded.sessionId);

  if (!session) {
    return res.status(401).json({
      message: "Session not found",
    });
  }

  // Check if user has logged out earlier
  if (session.revoked) {
    return res.status(401).json({
      message: "Session revoked",
    });
  }

  // Compare incoming refresh token with hashed token stored in DB
  const isValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);

  if (!isValid) {
    return res.status(401).json({
      message: "Invalid refresh token",
    });
  }

  // Generate new short-lived access token
  const accessToken = jwt.sign(
    {
      id: decoded.id,
      type: "access",
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  // Generate new refresh token (Refresh Token Rotation)
  const newRefreshToken = jwt.sign(
    {
      id: decoded.id,
      sessionId: session._id,
      type: "refresh",
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  // Store hash of newly generated refresh token
  session.refreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

  await session.save();

  // Replace old refresh token cookie with new one
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    message: "Access Token Refreshed Successfully",
    accessToken,
  });
};

const postLogOut = async (req, res) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh Token Not Found",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    // Ensure token type is refresh
    if (decoded.type !== "refresh") {
      return res.status(401).json({
        message: "Invalid Refresh Token",
      });
    }

    // Find session associated with this token
    const session = await sessionModel.findById(decoded.sessionId);

    if (!session) {
      return res.status(404).json({
        message: "Session Not Found",
      });
    }

    // Mark session as revoked
    // Revoked sessions cannot be used to refresh tokens anymore
    session.revoked = true;

    await session.save();

    // Remove refresh token cookie from browser
    res.clearCookie("refreshToken");

    return res.status(200).json({
      message: "Logged Out Successfully",
    });
  } catch (error) {
    res.clearCookie("refreshToken");

    return res.status(200).json({
      message: "Logged Out Successfully",
    });
  }
};

const postLogOutAll = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token not found",
    });
  }

  const decode = jwt.verify(refreshToken, config.JWT_SECRET);

  await sessionModel.updateMany(
    {
      user: decode.id,
      revoke: false,
    },
    {
      revoke: true,
    },
  );

  res.clearCookie("refreshToken");

  return res.status(200).json({
    message: "Logged out from all the devices",
  });
};

const getVerifyEmail = async (req, res) => {
  const { otp, email } = req.body;

  const otpDoc = await otpModel.findOne({ email });

  if (!otpDoc) {
    return res.status(401).json({
      message: "email is not registered",
    });
  }

  const isMatch = await bcrypt.compare(otp, otpDoc.otpHash);

  if (!isMatch) {
    return req.status(401).json({
      message: "OTP is Incorrect",
    });
  }

  const user = await userModel.findByIdAndUpdate(otpDoc.user, {
    verified: true,
  });

  await otpModel.deleteMany({
    user: otpDoc.user,
  });

  return res.status(200).json({
    message: "Email verified Successfully",
    user: {
      username: user.username,
      email: user.email,
      verified: user.verified,
    },
  });
};

export default {
  postSignUp,
  getMe,
  postRefreshToken,
  postLogOut,
  postLogOutAll,
  postLogin,
  getVerifyEmail,
};
