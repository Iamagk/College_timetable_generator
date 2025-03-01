import Subject from "../models/Subject.js";
import Teacher from "../models/Teacher.js";
import Timetable from "../models/Timetable.js";

const generateTimetable = async (
  semester,
  department,
  section,
  selectedSubjects
) => {
  console.log("Starting timetable generation...");
  console.log(
    `Semester: ${semester}, Department: ${department}, Section: ${section}`
  );
  console.log("Selected Subjects:", selectedSubjects);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const slots = [1, 2, 3, 4, 5, 6, 7];
  const validLabSlotPairs = [
    [1, 2],
    [3, 4],
    [5, 6],
    [6, 7],
  ];

  // Initialize the schedule with empty slots
  const schedule = days.map((day) => ({
    day,
    slots: slots.map((slotNumber) => ({ slotNumber })),
  }));

  console.log("Fetching subject details...");
  const subjectsWithDetails = await Promise.all(
    selectedSubjects.map(async (subject) => {
      const subjectDetails = await Subject.findById(subject.subject).populate(
        "teachers"
      );
      const selectedTeachers = await Teacher.find({
        _id: { $in: subject.teachers },
      });
      console.log(
        `Subject: ${subjectDetails.name}, Type: ${
          subjectDetails.type
        }, Credits: ${
          subjectDetails.credits
        }, Selected Teachers: ${selectedTeachers.map((t) => t.name).join(", ")}`
      );
      return {
        ...subjectDetails.toObject(),
        selectedTeachers: selectedTeachers,
        assignedSlots: 0,
      };
    })
  );

  console.log("Fetching existing timetables...");
  const existingTimetables = await Timetable.find().populate({
    path: "schedule.slots.subject",
    populate: { path: "teachers" },
  });
  console.log(`Found ${existingTimetables.length} existing timetables`);

  // Create a map to store teacher schedules across all timetables
  const teacherSchedules = new Map();

  console.log("Populating teacher schedules from existing timetables...");
  existingTimetables.forEach((timetable) => {
    timetable.schedule.forEach((day, dayIndex) => {
      day.slots.forEach((slot) => {
        if (slot.subject && slot.teachers) {
          slot.teachers.forEach((teacher) => {
            const teacherId = teacher._id.toString();
            if (!teacherSchedules.has(teacherId)) {
              teacherSchedules.set(
                teacherId,
                Array(days.length)
                  .fill()
                  .map(() => Array(slots.length).fill(false))
              );
            }
            teacherSchedules.get(teacherId)[dayIndex][
              slot.slotNumber - 1
            ] = true;
          });
        }
      });
    });
  });

  // Function to check hard constraints
  const checkHardConstraints = (day, slot, subject, teachers) => {
    // Check if the slot is already occupied
    if (schedule[day].slots[slot - 1].subject) return false;

    // Check teacher availability and conflicts
    for (const teacher of teachers) {
      const teacherId = teacher._id.toString();
      const teacherSchedule =
        teacherSchedules.get(teacherId) ||
        Array(days.length)
          .fill()
          .map(() => Array(slots.length).fill(false));

      if (!teacher.availability[days[day].toLowerCase()]) return false;
      if (teacherSchedule[day][slot - 1]) return false;
    }

    // Check lab slot pairs
    if (subject.type === "lab") {
      const validPair = validLabSlotPairs.find((pair) => pair[0] === slot);
      if (!validPair) return false;

      // Check if the next slot is available for a lab
      const nextSlot = validPair[1];
      if (schedule[day].slots[nextSlot - 1].subject) return false;
      for (const teacher of teachers) {
        const teacherId = teacher._id.toString();
        const teacherSchedule =
          teacherSchedules.get(teacherId) ||
          Array(days.length)
            .fill()
            .map(() => Array(slots.length).fill(false));
        if (teacherSchedule[day][nextSlot - 1]) return false;
      }
    }

    return true;
  };

  // Function to evaluate soft constraints
  const evaluateSoftConstraints = (day, slot, subject) => {
    let score = 0;

    // Prefer not to have the same subject multiple times in a day
    const subjectOnThisDay = schedule[day].slots.some(
      (s) => s.subject && s.subject._id.toString() === subject._id.toString()
    );
    if (subjectOnThisDay) score -= 1;

    // Prefer to distribute subjects evenly across the week
    const subjectDistribution = days.map(
      (d) =>
        schedule[days.indexOf(d)].slots.filter(
          (s) =>
            s.subject && s.subject._id.toString() === subject._id.toString()
        ).length
    );
    const evenDistribution =
      Math.max(...subjectDistribution) - Math.min(...subjectDistribution) <= 1;
    if (evenDistribution) score += 1;

    // Prefer labs in later slots of the day
    if (subject.type === "lab" && slot > 3) score += 1;

    return score;
  };

  // Function to update teacher schedules
  const updateTeacherSchedules = (
    day,
    slot,
    subject,
    teachers,
    isAssigning = true
  ) => {
    teachers.forEach((teacher) => {
      const teacherId = teacher._id.toString();
      if (!teacherSchedules.has(teacherId)) {
        teacherSchedules.set(
          teacherId,
          Array(days.length)
            .fill()
            .map(() => Array(slots.length).fill(false))
        );
      }
      teacherSchedules.get(teacherId)[day][slot - 1] = isAssigning;
      if (subject.type === "lab") {
        const labPair = validLabSlotPairs.find((pair) => pair[0] === slot);
        if (labPair) {
          teacherSchedules.get(teacherId)[day][labPair[1] - 1] = isAssigning;
        }
      }
    });
  };

  // Sort subjects by credits (descending) and then by type (lab first)
  subjectsWithDetails.sort((a, b) => {
    if (b.credits !== a.credits) return b.credits - a.credits;
    return a.type === "lab" ? -1 : 1;
  });

  // Backtracking function to assign subjects
  const assignSubjects = (subjectIndex) => {
    console.log(`Attempting to assign subject at index ${subjectIndex}`);
    if (subjectIndex >= subjectsWithDetails.length) {
      console.log("All subjects assigned successfully");
      return true;
    }

    const subject = subjectsWithDetails[subjectIndex];
    const requiredSlots = subject.credits;
    console.log(`Assigning ${subject.name}, Required slots: ${requiredSlots}`);

    for (let slot = 1; slot <= slots.length; slot++) {
      for (let day = 0; day < days.length; day++) {
        if (
          checkHardConstraints(day, slot, subject, subject.selectedTeachers)
        ) {
          const softConstraintScore = evaluateSoftConstraints(
            day,
            slot,
            subject
          );

          console.log(
            `Slot available. Assigning ${subject.name} to ${days[day]}, Slot ${slot}. Soft constraint score: ${softConstraintScore}`
          );

          schedule[day].slots[slot - 1] = {
            slotNumber: slot,
            subject: {
              _id: subject._id,
              name: subject.name,
              type: subject.type,
            },
            teachers: subject.selectedTeachers.map((teacher) => ({
              _id: teacher._id,
              name: teacher.name,
            })),
          };

          updateTeacherSchedules(day, slot, subject, subject.selectedTeachers);
          subject.assignedSlots++;

          if (subject.type === "lab") {
            const labPair = validLabSlotPairs.find((pair) => pair[0] === slot);
            if (labPair) {
              const nextSlot = labPair[1];
              console.log(
                `Assigning second slot for lab ${subject.name} to ${days[day]}, Slot ${nextSlot}`
              );
              schedule[day].slots[nextSlot - 1] = {
                slotNumber: nextSlot,
                subject: {
                  _id: subject._id,
                  name: subject.name,
                  type: subject.type,
                },
                teachers: subject.selectedTeachers.map((teacher) => ({
                  _id: teacher._id,
                  name: teacher.name,
                })),
              };
              updateTeacherSchedules(
                day,
                nextSlot,
                subject,
                subject.selectedTeachers
              );
              subject.assignedSlots++;
            }
          }

          if (subject.assignedSlots >= requiredSlots) {
            console.log(
              `All required slots assigned for ${subject.name}. Moving to next subject.`
            );
            if (assignSubjects(subjectIndex + 1)) {
              return true;
            }
          } else {
            console.log(`Continuing with ${subject.name} for remaining slots.`);
            if (assignSubjects(subjectIndex)) {
              return true;
            }
          }

          console.log(
            `Backtracking: Removing assignment of ${subject.name} from ${days[day]}, Slot ${slot}`
          );
          schedule[day].slots[slot - 1] = { slotNumber: slot };
          subject.assignedSlots--;
          updateTeacherSchedules(
            day,
            slot,
            subject,
            subject.selectedTeachers,
            false
          );

          if (subject.type === "lab") {
            const labPair = validLabSlotPairs.find((pair) => pair[0] === slot);
            if (labPair) {
              const nextSlot = labPair[1];
              console.log(
                `Removing second slot assignment for lab ${subject.name} from ${days[day]}, Slot ${nextSlot}`
              );
              schedule[day].slots[nextSlot - 1] = { slotNumber: nextSlot };
              subject.assignedSlots--;
              updateTeacherSchedules(
                day,
                nextSlot,
                subject,
                subject.selectedTeachers,
                false
              );
            }
          }
        }
      }
    }

    console.log(`Failed to assign all slots for ${subject.name}`);
    return false;
  };

  console.log("Starting subject assignment process with backtracking...");
  const success = assignSubjects(0);

  if (!success) {
    console.log("Timetable generation failed. Unable to assign all subjects.");
    console.log("Partial timetable:", JSON.stringify(schedule, null, 2));
    throw new Error(
      "Unable to generate a valid timetable with the given constraints"
    );
  }

  console.log("Timetable generation successful. Filtering out empty slots...");
  const filteredSchedule = schedule.map((day) => ({
    day: day.day,
    slots: day.slots.filter((slot) => slot.subject),
  }));

  console.log("Final timetable:", JSON.stringify(filteredSchedule, null, 2));

  // Verify credit-based assignments
  let creditsVerification = true;
  subjectsWithDetails.forEach((subject) => {
    const assignedSlots = filteredSchedule.reduce(
      (total, day) =>
        total +
        day.slots.filter(
          (slot) => slot.subject._id.toString() === subject._id.toString()
        ).length,
      0
    );
    if (assignedSlots !== subject.credits) {
      console.error(
        `Credit mismatch for ${subject.name}: Expected ${subject.credits}, Assigned ${assignedSlots}`
      );
      creditsVerification = false;
    }
  });

  if (!creditsVerification) {
    throw new Error("Credit-based assignment verification failed");
  }

  return { schedule: filteredSchedule };
};

export default generateTimetable;
