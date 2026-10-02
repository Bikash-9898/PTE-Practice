import { Router } from "express";
import {
  audioMiddleware,
  imageMiddleware,
  uploadAudio,
  uploadImage,
} from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = Router();

// Upload routes are admin-only. Admin UIs that own questions can attach
// audio or images to question records.
router.post("/audio", authMiddleware, adminMiddleware, audioMiddleware, uploadAudio);
router.post("/image", authMiddleware, adminMiddleware, imageMiddleware, uploadImage);

export default router;
