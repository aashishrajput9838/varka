import { Router } from "express";
import {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Registration & OTP
router.post("/register", registerUser);
router.post("/register/verify-otp", verifyOtp);
router.post("/register/resend-otp", resendOtp);

// Login & Session
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", authMiddleware, getMe);

// Password Recovery
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
