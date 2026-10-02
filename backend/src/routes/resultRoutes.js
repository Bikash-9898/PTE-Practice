import { Router } from "express";
import {
  submitAttempt,
  recordPracticeAttempt,
  updateAttemptScore,
  myResults,
  getResult,
  myProgress,
} from "../controllers/resultController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authMiddleware, submitAttempt);
router.post("/practice", authMiddleware, recordPracticeAttempt);
router.get("/my-results", authMiddleware, myResults);
router.get("/progress", authMiddleware, myProgress);
router.patch("/:id/score", authMiddleware, updateAttemptScore);
router.get("/:id", authMiddleware, getResult);

export default router;
