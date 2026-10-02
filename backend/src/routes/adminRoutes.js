import { Router } from "express";
import {
  getDashboard,
  listStudents,
  getStudent,
  setStudentStatus,
  deleteStudent,
  listResults,
  getStatistics,
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", getDashboard);
router.get("/statistics", getStatistics);

router.get("/students", listStudents);
router.get("/students/:id", getStudent);
router.patch("/students/:id/status", setStudentStatus);
router.delete("/students/:id", deleteStudent);

router.get("/results", listResults);

export default router;
