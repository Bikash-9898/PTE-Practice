import { Router } from "express";
import {
  listQuestions,
  getQuestion,
  listBySkill,
  listByType,
  checkAnswer,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  togglePublish,
} from "../controllers/questionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = Router();

// Public-but-auth-aware listing. If a valid token is provided the
// server will return the admin shape; otherwise the safe shape.
router.get("/", authMiddleware, listQuestions);

// Public read (will return the safe shape when unauthenticated)
router.get("/skill/:skill", authMiddleware, listBySkill);
router.get("/type/:type", authMiddleware, listByType);
router.post("/:id/check", authMiddleware, checkAnswer);
router.get("/:id", authMiddleware, getQuestion);

// Admin-only mutations
router.post("/", authMiddleware, adminMiddleware, createQuestion);
router.put("/:id", authMiddleware, adminMiddleware, updateQuestion);
router.delete("/:id", authMiddleware, adminMiddleware, deleteQuestion);
router.patch("/:id/publish", authMiddleware, adminMiddleware, togglePublish);

export default router;
