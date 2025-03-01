import Teacher from "../models/Teacher.js";
import Timetable from "../models/Timetable.js";

export const updateTeacherWorkloads = async (timetable, isDelete = false) => {
  console.log("Updating teacher workloads...");

  // Get all teachers
  const teachers = await Teacher.find();
  const teacherWorkloads = {};

  // Initialize workloads to 0
  teachers.forEach((teacher) => {
    teacherWorkloads[teacher._id.toString()] = 0;
  });

  // Get all timetables
  const timetables = await Timetable.find()
    .populate("schedule.slots.subject")
    .populate("schedule.slots.teachers");

  // Calculate workloads based on all timetables
  timetables.forEach((currentTimetable) => {
    if (
      isDelete &&
      currentTimetable._id.toString() === timetable._id.toString()
    ) {
      return; // Skip the timetable being deleted
    }
    for (const day of currentTimetable.schedule) {
      for (const slot of day.slots) {
        if (slot && slot.subject && slot.teachers && slot.teachers.length > 0) {
          for (const teacher of slot.teachers) {
            const id =
              typeof teacher === "object"
                ? teacher._id.toString()
                : teacher.toString();
            teacherWorkloads[id] = (teacherWorkloads[id] || 0) + 1;
          }
        }
      }
    }
  });

  // Update each teacher's workload
  for (const [teacherId, workload] of Object.entries(teacherWorkloads)) {
    try {
      const teacher = await Teacher.findById(teacherId);
      if (teacher) {
        console.log(
          `Updating workload for teacher ${teacher.name}: ${workload}`
        );
        await Teacher.findByIdAndUpdate(
          teacherId,
          { $set: { currentWorkload: workload } },
          { new: true }
        );
      } else {
        console.log(`Teacher not found for ID: ${teacherId}`);
      }
    } catch (error) {
      console.error(`Error updating workload for teacher ${teacherId}:`, error);
    }
  }

  console.log("Teacher workloads updated successfully.");
};
