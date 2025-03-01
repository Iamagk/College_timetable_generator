import express from "express";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsBySemester,
} from "../controllers/subjectController.js";


const router = express.Router();

router.get("/", getSubjects);
router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);
router.get("/semester/:semester", getSubjectsBySemester);

export default router;
