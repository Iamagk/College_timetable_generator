import express from "express";
import {
  getTimetables,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getTeacherTimetable,
  generateAndSaveTimetable,
} from "../controllers/timetableController.js";

const router = express.Router();

router.get("/", getTimetables);
router.post("/", createTimetable);
router.put("/:id", updateTimetable);
router.delete("/:id", deleteTimetable);
router.get("/teacher/:teacherId", getTeacherTimetable);
router.post("/generate", generateAndSaveTimetable);

export default router;
