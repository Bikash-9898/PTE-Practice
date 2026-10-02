import { Router } from "express";
import { scoreWithAi } from "../controllers/aiController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/score", authMiddleware, scoreWithAi);

export default router;