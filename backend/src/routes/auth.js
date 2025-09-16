import express from "express";
import { 
  registerUser, 
  loginUser, 
  googleLogin, 
  decodeGoogleToken, 
  googleSignupWithRole 
} from "../controllers/authController.js";

const router = express.Router();

// Normal auth
router.post("/signup", registerUser);
router.post("/login", loginUser);

// Google OAuth login
router.post("/google", googleLogin);

// Google OAuth signup with role selection
router.post("/google-decode", decodeGoogleToken);
router.post("/google-signup", googleSignupWithRole);

export default router;
