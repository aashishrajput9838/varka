import { Request, Response } from "express";
import userModel from "../db/mongodb/user/user.model.js";
import hashService from "../services/hash.js";
import jwtService from "../services/jwt.js";
import generateOTP from "../services/otp.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, gender, phone } = req.body;

    if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
      return res.status(400).json({
        success: false,
        message: "First name is required",
      });
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required",
      });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (!gender || !["male", "female", "other"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Gender must be male, female, or other",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await userModel.findOne({ email: normalizedEmail });

    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered. Please sign in.",
      });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hashedPassword = await hashService.hashingPassword(password);
    const seed = encodeURIComponent(
      `${firstName.trim()} ${lastName ? lastName.trim() : ""}`.trim()
    );
    const avatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=c65d2c,171310`;

    if (existingUser && !existingUser.isEmailVerified) {
      // Update existing unverified user
      existingUser.firstName = firstName.trim();
      if (lastName) existingUser.lastName = lastName.trim();
      existingUser.password = hashedPassword;
      existingUser.gender = gender;
      if (phone) existingUser.phone = phone.trim();
      existingUser.avatar = avatar;
      existingUser.emailVerificationToken = otp;
      existingUser.emailVerificationExpires = otpExpires;
      await existingUser.save();
    } else {
      // Create new user
      await userModel.create({
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : undefined,
        email: normalizedEmail,
        password: hashedPassword,
        gender,
        phone: phone ? phone.trim() : undefined,
        avatar,
        isEmailVerified: false,
        emailVerificationToken: otp,
        emailVerificationExpires: otpExpires,
      });
    }

    // Asynchronously dispatch email without blocking response
    sendVerificationEmail(normalizedEmail, firstName.trim(), otp).catch((err) => {
      console.error("[EMAIL SERVICE] Async dispatch error:", err);
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to register user",
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedOtp = String(otp).trim();

    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. Please sign in.",
      });
    }

    if (!user.emailVerificationToken || user.emailVerificationToken !== normalizedOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check the code and try again.",
      });
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    user.isEmailVerified = true;
    user.set("emailVerificationToken", undefined);
    user.set("emailVerificationExpires", undefined);
    await user.save();

    const accessToken = jwtService.createAccessToken(user._id.toString());

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      gender: user.gender,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    };

    return res.status(200).json({
      success: true,
      message: "Registration successful",
      accessToken,
      data: {
        user: userData,
        accessToken,
      },
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify OTP",
    });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(String(email).trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Valid email is required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. Please sign in.",
      });
    }

    const otp = generateOTP();
    user.emailVerificationToken = otp;
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendVerificationEmail(normalizedEmail, user.firstName, otp).catch((err) => {
      console.error("[EMAIL SERVICE] Async dispatch error:", err);
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to resend OTP",
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await userModel.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await hashService.compareHashedPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isEmailVerified) {
      const otp = generateOTP();
      user.emailVerificationToken = otp;
      user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      sendVerificationEmail(normalizedEmail, user.firstName, otp).catch((err) => {
        console.error("[EMAIL SERVICE] Async dispatch error:", err);
      });

      return res.status(403).json({
        success: false,
        message: "Please verify your email before signing in.",
        requiresVerification: true,
        email: user.email,
      });
    }

    const accessToken = jwtService.createAccessToken(user._id.toString());

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      gender: user.gender,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    };

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      data: {
        user: userData,
        accessToken,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to sign in",
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(String(email).trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found registered with this email address",
      });
    }

    const otp = generateOTP();
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    sendPasswordResetEmail(normalizedEmail, user.firstName, otp).catch((err) => {
      console.error("[EMAIL SERVICE] Async dispatch error:", err);
    });

    return res.status(200).json({
      success: true,
      message: "Password reset verification code dispatched to your email",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process password reset request",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, reset code, and new password are required",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedOtp = String(otp).trim();

    const user = await userModel.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.resetPasswordToken || user.resetPasswordToken !== normalizedOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please check and try again.",
      });
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one.",
      });
    }

    const hashedPassword = await hashService.hashingPassword(newPassword);
    user.password = hashedPassword;
    user.isEmailVerified = true;
    user.set("resetPasswordToken", undefined);
    user.set("resetPasswordExpires", undefined);
    await user.save();

    const accessToken = jwtService.createAccessToken(user._id.toString());

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      gender: user.gender,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    };

    return res.status(200).json({
      success: true,
      message: "Password reset successfully! Logged in.",
      accessToken,
      data: {
        user: userData,
        accessToken,
      },
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to log out",
    });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await userModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          gender: user.gender,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user data",
    });
  }
};
