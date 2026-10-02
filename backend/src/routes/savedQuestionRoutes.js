import { Router } from "express";
import {
  saveQuestion,
  listSaved,
  removeSaved,
  removeById,
} from "../controllers/savedQuestionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/:questionId", authMiddleware, saveQuestion);
router.get("/", authMiddleware, listSaved);
router.delete("/id/:id", authMiddleware, removeById);
router.delete("/:questionId", authMiddleware, removeSaved);

export default router;
