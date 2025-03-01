import Timetable from "../models/Timetable.js";
import { validateTimetable } from "../utils/timetableValidation.js";
import { updateTeacherWorkloads } from "../utils/updateTeacherWorkloads.js";
import mongoose from "mongoose";
import generateTimetable from "../utils/timetableGenerator.js";

export const getTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find().populate({
      path: "schedule.slots.subject",
      populate: { path: "teachers" },
    });
    res.status(200).json(timetables);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// export const deleteTimetable = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const deletedTimetable = await Timetable.findByIdAndDelete(id);

//     if (!deletedTimetable) {
//       return res.status(404).json({ message: "Timetable not found" });
//     }

//     // Subtract workload from the deleted timetable
//     await updateTeacherWorkloads(deletedTimetable, true);

//     res.status(200).json({ message: "Timetable deleted successfully" });
//   } catch (error) {
//     res.status(409).json({ message: error.message });
//   }
// };

export const createTimetable = async (req, res) => {
  console.log("Received timetable data:", req.body);
  const timetableData = req.body;
  const newTimetable = new Timetable(timetableData);

  try {
    console.log("Validating timetable...");
    const validationResult = await validateTimetable(newTimetable);
    console.log("Validation result:", validationResult);

    if (!validationResult.isValid) {
      return res.status(400).json({
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      });
    }

    console.log("Saving timetable...");
    const savedTimetable = await newTimetable.save();
    console.log("Timetable saved successfully:", savedTimetable);

    // Update teacher workloads
    await updateTeacherWorkloads(savedTimetable);

    res
      .status(201)
      .json({ timetable: savedTimetable, warnings: validationResult.warnings });
  } catch (error) {
    console.error("Error creating timetable:", error);
    res.status(409).json({ message: error.message });
  }
};

export const updateTimetable = async (req, res) => {
  const { id } = req.params;
  const timetableData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Invalid timetable ID" });
  }

  try {
    const existingTimetable = await Timetable.findById(id);
    if (!existingTimetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    // Merge existing timetable with update data
    const updatedTimetableData = {
      ...existingTimetable.toObject(),
      ...timetableData,
      _id: id,
    };

    const validationResult = await validateTimetable(updatedTimetableData);
    if (!validationResult.isValid) {
      return res.status(400).json({
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      });
    }

    // Subtract workload from the old timetable
    await updateTeacherWorkloads(existingTimetable, true);

    const updatedTimetable = await Timetable.findByIdAndUpdate(
      id,
      updatedTimetableData,
      { new: true }
    );

    // Add workload from the new timetable
    await updateTeacherWorkloads(updatedTimetable);

    res.status(200).json({
      timetable: updatedTimetable,
      warnings: validationResult.warnings,
    });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const getTeacherTimetable = async (req, res) => {
  const { teacherId } = req.params;

  try {
    const timetables = await Timetable.find({
      "schedule.slots.teachers": teacherId,
    }).populate("schedule.slots.subject");

    const teacherTimetable = [];

    timetables.forEach((timetable) => {
      timetable.schedule.forEach((day) => {
        day.slots.forEach((slot) => {
          if (slot.teachers.includes(teacherId)) {
            teacherTimetable.push({
              day: day.day,
              slotNumber: slot.slotNumber,
              subject: slot.subject,
              timetableInfo: `${timetable.department} - Semester ${timetable.semester} - Section ${timetable.section}`,
            });
          }
        });
      });
    });

    res.status(200).json(teacherTimetable);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// export const generateAndSaveTimetable = async (req, res) => {
//   const { semester, department, section, selectedSubjects } = req.body;

//   try {
//     const generatedTimetable = await generateTimetable(
//       semester,
//       department,
//       section,
//       selectedSubjects
//     );
//     const newTimetable = new Timetable(generatedTimetable);
//     const savedTimetable = await newTimetable.save();

//     // Update teacher workloads
//     await updateTeacherWorkloads(savedTimetable);

//     res.status(201).json({
//       timetable: savedTimetable,
//       message: "Timetable generated and saved successfully",
//     });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// export const generateAndSaveTimetable = async (req, res) => {
//   const { semester, department, section, selectedSubjects } = req.body;

//   try {
//     const generatedTimetable = await generateTimetable(
//       semester,
//       department,
//       section,
//       selectedSubjects
//     );
//     const newTimetable = new Timetable(generatedTimetable);
//     const savedTimetable = await newTimetable.save();

//     // Update teacher workloads
//     await updateTeacherWorkloads(savedTimetable);

//     res.status(201).json({
//       timetable: savedTimetable,
//       message: "Timetable generated and saved successfully",
//       warnings: generatedTimetable.warnings || [],
//     });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// export const generateAndSaveTimetable = async (req, res) => {
//   const { semester, department, section, selectedSubjects } = req.body;

//   try {
//     const { timetable: generatedTimetable, warnings } = await generateTimetable(
//       semester,
//       department,
//       section,
//       selectedSubjects
//     );
//     const newTimetable = new Timetable(generatedTimetable);
//     const savedTimetable = await newTimetable.save();

//     // Update teacher workloads
//     await updateTeacherWorkloads(savedTimetable);

//     res.status(201).json({
//       timetable: savedTimetable,
//       message: "Timetable generated and saved successfully",
//       warnings: warnings || [],
//     });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// export const generateAndSaveTimetable = async (req, res) => {
//   const { semester, department, section, selectedSubjects } = req.body;

//   console.log('Received request to generate timetable:', { semester, department, section, selectedSubjects });

//   try {
//     const { timetable: generatedTimetable, warnings } = await generateTimetable(semester, department, section, selectedSubjects);
//     console.log('Timetable generated successfully:', generatedTimetable);

//     const newTimetable = new Timetable(generatedTimetable);
//     const savedTimetable = await newTimetable.save();
//     console.log('Timetable saved to database:', savedTimetable);

//     // Update teacher workloads
//     await updateTeacherWorkloads(savedTimetable);
//     console.log('Teacher workloads updated');

//     res.status(201).json({
//       timetable: savedTimetable,
//       message: 'Timetable generated and saved successfully',
//       warnings: warnings || []
//     });
//   } catch (error) {
//     console.error('Error generating timetable:', error);
//     res.status(400).json({ message: error.message });
//   }
// };

// export const generateAndSaveTimetable = async (req, res) => {
//   const { semester, department, section, selectedSubjects } = req.body;

//   console.log('Received request to generate timetable:', { semester, department, section, selectedSubjects });

//   try {
//     const { timetable: generatedTimetable, warnings } = await generateTimetable(semester, department, section, selectedSubjects);
//     console.log('Timetable generated successfully:', JSON.stringify(generatedTimetable, null, 2));

//     const newTimetable = new Timetable(generatedTimetable);
//     const savedTimetable = await newTimetable.save();
//     console.log('Timetable saved to database:', JSON.stringify(savedTimetable, null, 2));

//     // Update teacher workloads
//     await updateTeacherWorkloads(savedTimetable);
//     console.log('Teacher workloads updated');

//     res.status(201).json({
//       timetable: savedTimetable,
//       message: 'Timetable generated and saved successfully',
//       warnings: warnings || []
//     });
//   } catch (error) {
//     console.error('Error generating timetable:', error);
//     res.status(400).json({
//       message: error.message || 'Failed to generate timetable',
//       error: error.toString()
//     });
//   }
// };

// export const generateAndSaveTimetable = async (req, res) => {
//   const { semester, department, section, selectedSubjects } = req.body;

//   console.log(
//     "Received request to generate timetable:",
//     JSON.stringify({ semester, department, section, selectedSubjects }, null, 2)
//   );

//   try {
//     const { timetable: generatedTimetable, warnings } = await generateTimetable(
//       semester,
//       department,
//       section,
//       selectedSubjects
//     );
//     console.log(
//       "Timetable generated successfully:",
//       JSON.stringify(generatedTimetable, null, 2)
//     );

//     // Perform final validation
//     const validationResult = await validateTimetable(generatedTimetable);
//     if (!validationResult.isValid) {
//       return res.status(400).json({
//         message: "Generated timetable is not valid",
//         errors: validationResult.errors,
//         warnings: [...warnings, ...validationResult.warnings],
//       });
//     }

//     const newTimetable = new Timetable(generatedTimetable);
//     const savedTimetable = await newTimetable.save();
//     console.log(
//       "Timetable saved to database:",
//       JSON.stringify(savedTimetable, null, 2)
//     );

//     // Update teacher workloads
//     await updateTeacherWorkloads(savedTimetable);
//     console.log("Teacher workloads updated");

//     res.status(201).json({
//       timetable: savedTimetable,
//       message: "Timetable generated and saved successfully",
//       warnings: [...warnings, ...validationResult.warnings],
//     });
//   } catch (error) {
//     console.error("Error generating timetable:", error);
//     res.status(400).json({
//       message: error.message || "Failed to generate timetable",
//       error: error.toString(),
//     });
//   }
// };

// export const generateAndSaveTimetable = async (req, res) => {
//   const { semester, department, section, selectedSubjects } = req.body;

//   console.log("Received request to generate timetable:", {
//     semester,
//     department,
//     section,
//     selectedSubjects,
//   });

//   try {
//     const { schedule, warnings } = await generateTimetable(
//       semester,
//       department,
//       section,
//       selectedSubjects
//     );

//     const generatedTimetable = {
//       semester,
//       department,
//       section,
//       schedule,
//     };

//     console.log("Timetable generated successfully:", generatedTimetable);

//     // const validationResult = await validateTimetable(generatedTimetable);

//     // if (!validationResult.isValid) {
//     //   return res.status(400).json({
//     //     message: "Generated timetable is not valid",
//     //     errors: validationResult.errors,
//     //     warnings: [...warnings, ...validationResult.warnings],
//     //   });
//     // }

//     const newTimetable = new Timetable(generatedTimetable);
//     const savedTimetable = await newTimetable.save();
//     console.log("Timetable saved to database:", savedTimetable);

//     // Update teacher workloads
//     await updateTeacherWorkloads(savedTimetable);
//     console.log("Teacher workloads updated");

//     res.status(201).json({
//       timetable: savedTimetable,
//       message: "Timetable generated and saved successfully",
//       warnings: [...warnings, ...validationResult.warnings],
//     });
//   } catch (error) {
//     console.error("Error generating timetable:", error);
//     res.status(400).json({
//       message: error.message || "Failed to generate timetable",
//       error: error.toString(),
//     });
//   }
// };

// export const generateAndSaveTimetable = async (req, res) => {
//   const { semester, department, section, selectedSubjects } = req.body;

//   console.log("Received request to generate timetable:", {
//     semester,
//     department,
//     section,
//     selectedSubjects,
//   });

//   try {
//     const { schedule, warnings } = await generateTimetable(
//       semester,
//       department,
//       section,
//       selectedSubjects
//     );

//     const generatedTimetable = {
//       semester,
//       department,
//       section,
//       schedule,
//     };

//     console.log("Timetable generated successfully:", generatedTimetable);

//     const validationResult = await validateTimetable(generatedTimetable);

//     if (!validationResult.isValid) {
//       return res.status(400).json({
//         message: "Generated timetable is not valid",
//         errors: validationResult.errors,
//         warnings: [...warnings, ...validationResult.warnings],
//       });
//     }

//     const newTimetable = new Timetable(generatedTimetable);
//     const savedTimetable = await newTimetable.save();
//     console.log("Timetable saved to database:", savedTimetable);

//     // Update teacher workloads
//     await updateTeacherWorkloads(savedTimetable);
//     console.log("Teacher workloads updated");

//     res.status(201).json({
//       timetable: savedTimetable,
//       message: "Timetable generated and saved successfully",
//       warnings: [...warnings, ...validationResult.warnings],
//     });
//   } catch (error) {
//     console.error("Error generating timetable:", error);
//     res.status(400).json({
//       message: error.message || "Failed to generate timetable",
//       error: error.toString(),
//     });
//   }
// };

// export const generateAndSaveTimetable = async (req, res) => {
//   const { semester, department, section, selectedSubjects } = req.body;

//   console.log('Received request to generate timetable:', { semester, department, section, selectedSubjects });

//   try {
//     const { schedule, warnings } = await generateTimetable(semester, department, section, selectedSubjects);

//     const generatedTimetable = {
//       semester,
//       department,
//       section,
//       schedule
//     };

//     console.log('Timetable generated successfully:', JSON.stringify(generatedTimetable, null, 2));

//     const validationResult = await validateTimetable(generatedTimetable);

//     if (!validationResult.isValid) {
//       console.error('Timetable validation failed:', validationResult.errors);
//       return res.status(400).json({
//         message: 'Generated timetable is not valid',
//         errors: validationResult.errors,
//         warnings: [...warnings, ...validationResult.warnings]
//       });
//     }

//     const newTimetable = new Timetable(generatedTimetable);
//     const savedTimetable = await newTimetable.save();
//     console.log('Timetable saved to database:', savedTimetable._id);

//     // Update teacher workloads
//     await updateTeacherWorkloads(savedTimetable);
//     console.log('Teacher workloads updated');

//     res.status(201).json({
//       timetable: savedTimetable,
//       message: 'Timetable generated and saved successfully',
//       warnings: [...warnings, ...validationResult.warnings]
//     });
//   } catch (error) {
//     console.error('Error generating timetable:', error);
//     res.status(400).json({
//       message: error.message || 'Failed to generate timetable',
//       error: error.toString()
//     });
//   }
// };

// export const generateAndSaveTimetable = async (req, res) => {
//   const { semester, department, section, selectedSubjects } = req.body;

//   console.log("Received request to generate timetable:", {
//     semester,
//     department,
//     section,
//     selectedSubjects,
//   });

//   try {
//     const { schedule } = await generateTimetable(
//       semester,
//       department,
//       section,
//       selectedSubjects
//     );

//     const generatedTimetable = {
//       semester,
//       department,
//       section,
//       schedule,
//     };

//     console.log(
//       "Timetable generated successfully:",
//       JSON.stringify(generatedTimetable, null, 2)
//     );

//     const newTimetable = new Timetable(generatedTimetable);
//     const savedTimetable = await newTimetable.save();
//     console.log("Timetable saved to database:", savedTimetable._id);

//     // Update teacher workloads
//     await updateTeacherWorkloads(savedTimetable);
//     console.log("Teacher workloads updated");

//     res.status(201).json({
//       timetable: savedTimetable,
//       message: "Timetable generated and saved successfully",
//     });
//   } catch (error) {
//     console.error("Error generating timetable:", error);
//     res.status(400).json({
//       message: error.message || "Failed to generate timetable",
//       error: error.toString(),
//     });
//   }
// };

// ... (keep other existing functions)

// export const generateAndSaveTimetable = async (req, res) => {
//   const { semester, department, section, selectedSubjects } = req.body;

//   console.log('Received request to generate timetable:', { semester, department, section, selectedSubjects });

//   try {
//     const { schedule } = await generateTimetable(semester, department, section, selectedSubjects);

//     const generatedTimetable = {
//       semester,
//       department,
//       section,
//       schedule
//     };

//     console.log('Timetable generated successfully:', JSON.stringify(generatedTimetable, null, 2));

//     const newTimetable = new Timetable(generatedTimetable);
//     const savedTimetable = await newTimetable.save();
//     console.log('Timetable saved to database:', savedTimetable._id);

//     // Update teacher workloads
//     await updateTeacherWorkloads(savedTimetable);
//     console.log('Teacher workloads updated');

//     // Validate the generated timetable
//     const validationResult = await validateTimetable(savedTimetable);
//     console.log('Timetable validation result:', validationResult);

//     res.status(201).json({
//       timetable: savedTimetable,
//       message: 'Timetable generated and saved successfully'
//     });
//   } catch (error) {
//     console.error('Error generating timetable:', error);
//     res.status(400).json({
//       message: error.message || 'Failed to generate timetable',
//       error: error.toString()
//     });
//   }
// };

// //This is a placeholder for other functions.  The update only affected one function.  A real-world example would likely have more functions.
// export const deleteTimetable = async (req, res) => {
//     const timetableId = req.params.id;
//     try {
//         const timetable = await Timetable.findByIdAndDelete(timetableId);
//         if (!timetable) {
//             return res.status(404).json({ message: 'Timetable not found' });
//         }
//         await updateTeacherWorkloads(timetable, true); // Update with the boolean flag
//         res.status(200).json({ message: 'Timetable deleted successfully' });
//     } catch (error) {
//         console.error('Error deleting timetable:', error);
//         res.status(500).json({ message: 'Failed to delete timetable' });
//     }
// };

export const generateAndSaveTimetable = async (req, res) => {
  const { semester, department, section, selectedSubjects } = req.body;

  console.log("Received request to generate timetable:", {
    semester,
    department,
    section,
    selectedSubjects,
  });

  try {
    const { schedule } = await generateTimetable(
      semester,
      department,
      section,
      selectedSubjects
    );

    const generatedTimetable = {
      semester,
      department,
      section,
      schedule,
    };

    console.log(
      "Timetable generated successfully:",
      JSON.stringify(generatedTimetable, null, 2)
    );

    // Validate the generated timetable
    const validationResult = await validateTimetable(generatedTimetable);
    console.log("Timetable validation result:", validationResult);

    const newTimetable = new Timetable(generatedTimetable);
    const savedTimetable = await newTimetable.save();
    console.log("Timetable saved to database:", savedTimetable._id);

    // Update teacher workloads
    await updateTeacherWorkloads(savedTimetable);
    console.log("Teacher workloads updated");

    res.status(201).json({
      timetable: savedTimetable,
      message: "Timetable generated and saved successfully",
    });
  } catch (error) {
    console.error("Error generating timetable:", error);
    res.status(400).json({
      message: error.message || "Failed to generate timetable",
      error: error.toString(),
    });
  }
};

export const deleteTimetable = async (req, res) => {
  const { id } = req.params;
  try {
    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }
    await Timetable.findByIdAndDelete(id);
    await updateTeacherWorkloads(timetable, true);
    res.status(200).json({ message: "Timetable deleted successfully" });
  } catch (error) {
    console.error("Error deleting timetable:", error);
    res
      .status(500)
      .json({ message: "Failed to delete timetable", error: error.toString() });
  }
};

// Other controller functions remain unchanged
