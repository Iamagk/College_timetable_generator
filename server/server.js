import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import teacherRoutes from "./routes/teacherRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// ✅ Check if .env variables are loaded
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined! Check your Render environment variables.");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // Stop server if DB connection fails
  });

// ✅ Define Routes
app.use("/api/teachers", teacherRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/timetables", timetableRoutes);

// ✅ Root Route (For Testing)
app.get("/", (req, res) => {
  res.send("✅ Server is running!");
});

// ✅ Start Server (Only Once & At the End)
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));