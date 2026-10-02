import { Router } from "express";
import {
  listMockTests,
  getMockTest,
  createMockTest,
  updateMockTest,
  deleteMockTest,
  submitMockTest,
} from "../controllers/mockTestController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = Router();

// Student-facing (auth required to prevent abuse; admins see more detail)
router.get("/", authMiddleware, listMockTests);
router.get("/:id", authMiddleware, getMockTest);
router.post("/:id/submit", authMiddleware, submitMockTest);

// Admin-only mutations
router.post("/", authMiddleware, adminMiddleware, createMockTest);
router.put("/:id", authMiddleware, adminMiddleware, updateMockTest);
router.delete("/:id", authMiddleware, adminMiddleware, deleteMockTest);

export default router;
