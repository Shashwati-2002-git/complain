import express from "express";
import { 
  registerUser, 
  loginUser, 
  googleLogin, 
  decodeGoogleToken, 
  googleSignupWithRole,
  facebookLogin,
  facebookSignupWithRole,
  generateComplaintFromChat,
  processChatForComplaint,
  chatWithWatson,
  generateComplaintFromWatson,
  refreshToken,
  verifyOTP,
  resendOTP
} from "../controllers/authController.js";

const router = express.Router();

// Normal auth
router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);

// OTP verification
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// Google OAuth login
router.post("/google", googleLogin);

// Google OAuth signup with role selection
router.post("/google-decode", decodeGoogleToken);
router.post("/google-signup", googleSignupWithRole);

// Facebook OAuth login
router.post("/facebook", facebookLogin);

// Facebook OAuth signup with role selection
router.post("/facebook-signup", facebookSignupWithRole);

// AI-powered complaint generation from chat
router.post("/generate-complaint-from-chat", generateComplaintFromChat);
router.post("/process-chat", processChatForComplaint);

// IBM Watson Assistant integration
router.post("/chat-watson", chatWithWatson);
router.post("/generate-complaint-watson", generateComplaintFromWatson);

export default router;
