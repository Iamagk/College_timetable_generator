import Teacher from "../models/Teacher.js";

export const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.status(200).json(teachers);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createTeacher = async (req, res) => {
  const { name, type, department, maxWorkload, availability } = req.body;
  const newTeacher = new Teacher({
    name,
    type,
    department,
    maxWorkload,
    availability,
  });
  try {
    const savedTeacher = await newTeacher.save();
    res.status(201).json(savedTeacher);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { name, type, department, maxWorkload, availability } = req.body;
  try {
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      { name, type, department, maxWorkload, availability },
      { new: true }
    );
    res.status(200).json(updatedTeacher);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  const { id } = req.params;
  try {
    await Teacher.findByIdAndDelete(id);
    res.status(200).json({ message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};
