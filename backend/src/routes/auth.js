import express from "express";
import { registerUser, loginUser, googleLogin } from "../controllers/authController.js";

const router = express.Router();

// Normal auth
router.post("/signup", registerUser);
router.post("/login", loginUser);

// Google OAuth login
router.post("/google", googleLogin);

export default router;
