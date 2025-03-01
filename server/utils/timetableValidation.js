import Subject from "../models/Subject.js";
import Teacher from "../models/Teacher.js";
import Timetable from "../models/Timetable.js";

export const validateTimetable = async (timetable) => {
  console.log("Starting timetable validation...");
  const errors = [];
  const warnings = [];

  // Fetch all existing timetables
  const allTimetables = await Timetable.find().populate({
    path: "schedule.slots.subject",
    populate: { path: "teachers" },
  });

  // Include the current timetable being validated
  const timetablesToCheck = [...allTimetables, timetable];

  // Create a map to store all teacher schedules
  const teacherSchedules = new Map();

  // Function to add a slot to a teacher's schedule
  const addSlotToTeacherSchedule = (
    teacherId,
    day,
    slotNumber,
    subjectType,
    timetableInfo
  ) => {
    if (!teacherSchedules.has(teacherId)) {
      teacherSchedules.set(teacherId, new Map());
    }
    const teacherSchedule = teacherSchedules.get(teacherId);
    if (!teacherSchedule.has(day)) {
      teacherSchedule.set(day, []);
    }
    teacherSchedule.get(day).push({ slotNumber, subjectType, timetableInfo });
  };

  // Process all timetables including the current one
  for (const currentTimetable of timetablesToCheck) {
    const timetableInfo = `${currentTimetable.department} - Semester ${currentTimetable.semester} - Section ${currentTimetable.section}`;
    for (const day of currentTimetable.schedule) {
      for (const slot of day.slots) {
        if (slot && slot.subject && slot.teachers) {
          let subjectId = slot.subject._id
            ? slot.subject._id.toString()
            : slot.subject.toString();
          let subjectType;
          try {
            const subjectDoc = await Subject.findById(subjectId);
            subjectType = subjectDoc ? subjectDoc.type : "unknown";
          } catch (error) {
            console.error("Error fetching subject:", error);
            subjectType = "unknown";
          }
          for (const teacher of slot.teachers) {
            const teacherId = teacher._id
              ? teacher._id.toString()
              : teacher.toString();
            addSlotToTeacherSchedule(
              teacherId,
              day.day,
              slot.slotNumber,
              subjectType,
              timetableInfo
            );
          }
        }
      }
    }
  }

  // Check for continuous classes and conflicts
  for (const [teacherId, schedule] of teacherSchedules) {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) continue;

    let teacherWorkload = 0;

    for (const [day, slots] of schedule) {
      slots.sort((a, b) => a.slotNumber - b.slotNumber);

      // Check for conflicts (same slot, different timetables)
      const slotMap = new Map();
      for (const slot of slots) {
        if (!slotMap.has(slot.slotNumber)) {
          slotMap.set(slot.slotNumber, []);
        }
        slotMap.get(slot.slotNumber).push(slot);
      }

      for (const [slotNumber, conflictingSlots] of slotMap) {
        if (conflictingSlots.length > 1) {
          const conflictMessage = `Conflict: Teacher ${
            teacher.name
          } is scheduled in multiple classes at the same time on ${day}, Slot ${slotNumber}: ${conflictingSlots
            .map((s) => s.timetableInfo)
            .join(" and ")}`;
          errors.push(conflictMessage);
        }
      }

      // Check for continuous classes
      for (let i = 0; i < slots.length - 1; i++) {
        const currentSlot = slots[i];
        const nextSlot = slots[i + 1];

        if (nextSlot.slotNumber - currentSlot.slotNumber === 1) {
          if (
            currentSlot.subjectType === "theory" &&
            nextSlot.subjectType === "theory"
          ) {
            const errorMessage = `Teacher ${teacher.name} has consecutive theory classes on ${day}: ${currentSlot.timetableInfo} (Slot ${currentSlot.slotNumber}) and ${nextSlot.timetableInfo} (Slot ${nextSlot.slotNumber})`;
            errors.push(errorMessage);
          } else if (currentSlot.subjectType !== nextSlot.subjectType) {
            const warningMessage = `Teacher ${teacher.name} has consecutive theory and lab classes on ${day}: ${currentSlot.timetableInfo} (Slot ${currentSlot.slotNumber}) and ${nextSlot.timetableInfo} (Slot ${nextSlot.slotNumber})`;
            warnings.push(warningMessage);
          }
        }
      }

      teacherWorkload += slots.length;
    }

    // Check teacher workload
    if (teacherWorkload > teacher.maxWorkload) {
      const workloadMessage = `Teacher ${teacher.name} has been assigned ${teacherWorkload} slots, which exceeds their maximum workload of ${teacher.maxWorkload}`;
      errors.push(workloadMessage);
    }
  }

  // Check teacher availability
  for (const day of timetable.schedule) {
    for (const slot of day.slots) {
      if (slot && slot.subject && slot.teachers && slot.teachers.length > 0) {
        for (const teacherId of slot.teachers) {
          const teacher = await Teacher.findById(teacherId);
          if (
            teacher &&
            teacher.availability[day.day.toLowerCase()] === false
          ) {
            errors.push(
              `Teacher ${teacher.name} is scheduled on ${day.day} but is not available.`
            );
          }
        }
      }
    }
  }

  // Check for subject credits
  console.log("Checking subject credits...");
  const subjectCredits = {};
  for (const day of timetable.schedule) {
    for (const slot of day.slots) {
      if (slot && slot.subject) {
        const subjectId = slot.subject._id
          ? slot.subject._id.toString()
          : slot.subject.toString();
        subjectCredits[subjectId] = (subjectCredits[subjectId] || 0) + 1;
      }
    }
  }

  for (const subjectId in subjectCredits) {
    try {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        console.log(`Subject not found for ID: ${subjectId}`);
        errors.push(`Subject not found for ID: ${subjectId}`);
        continue;
      }
      console.log(
        `Subject ${subject.name} credits:`,
        subjectCredits[subjectId]
      );
      if (subjectCredits[subjectId] !== subject.credits) {
        errors.push(
          `Subject ${subject.name} has ${subjectCredits[subjectId]} slots, but requires ${subject.credits} credits.`
        );
      }
    } catch (error) {
      console.error("Error checking subject credits:", error);
      errors.push(`Error checking credits for subject ID: ${subjectId}`);
    }
  }

  console.log("Validation complete. Errors:", errors);
  console.log("Validation complete. Warnings:", warnings);
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings,
  };
};
