import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["assistant", "associate", "senior"],
    required: true,
  },
  department: { type: String, required: true },
  maxWorkload: { type: Number, required: true },
  currentWorkload: { type: Number, default: 0 },
  availability: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
  },
});

const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;
