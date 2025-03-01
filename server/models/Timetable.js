import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    slotNumber: { type: Number },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }],
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    slots: [slotSchema],
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema({
  semester: { type: Number, required: true },
  department: { type: String, required: true },
  section: { type: String, required: true },
  cluster: { type: String },
  schedule: [daySchema],
});

export default mongoose.model("Timetable", timetableSchema);
