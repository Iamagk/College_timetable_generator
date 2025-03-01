import Subject from "../models/Subject.js";

export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().populate("teachers");
    res.status(200).json(subjects);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createSubject = async (req, res) => {
  const { name, code, credits, semester, department, teachers, type } =
    req.body;
  const newSubject = new Subject({
    name,
    code,
    credits,
    semester,
    department,
    teachers,
    type,
  });
  try {
    const savedSubject = await newSubject.save();
    res.status(201).json(savedSubject);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateSubject = async (req, res) => {
  const { id } = req.params;
  const { name, code, credits, semester, department, teachers, type } =
    req.body;
  try {
    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      { name, code, credits, semester, department, teachers, type },
      { new: true }
    );
    res.status(200).json(updatedSubject);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  const { id } = req.params;
  try {
    await Subject.findByIdAndDelete(id);
    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const getSubjectsBySemester = async (req, res) => {
  const { semester } = req.params;
  try {
    const subjects = await Subject.find({
      semester: parseInt(semester),
    }).populate("teachers");
    res.status(200).json(subjects);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
