import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  credits: { type: Number, required: true },
  semester: { type: Number, required: true },
  department: { type: String, required: true },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }],
  type: { type: String, enum: ["lab", "theory"], required: true },
});

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
