import { Router } from "express";
import {
  register,
  login,
  logout,
  me,
  updateProfile,
  changePassword,
  dashboardStats,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);
router.get("/dashboard/stats", authMiddleware, dashboardStats);
router.put("/profile", authMiddleware, updateProfile);
router.post("/change-password", authMiddleware, changePassword);

export default router;
