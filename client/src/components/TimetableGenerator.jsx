import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function TimetableGenerator() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [generatedTimetable, setGeneratedTimetable] = useState(null);
  const [formData, setFormData] = useState({
    semester: '',
    department: '',
    section: '',
  });

  useEffect(() => {
    if (formData.semester) {
      fetchSubjects(formData.semester);
    }
  }, [formData.semester]);

  const fetchSubjects = async (semester) => {
    try {
      const response = await fetch(`http://localhost:5050/api/subjects/semester/${semester}`);
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      } else {
        toast.error('Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Error fetching subjects');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectSelect = (subjectId) => {
    setSelectedSubjects(prev => {
      const existing = prev.find(s => s.subject === subjectId);
      if (existing) {
        return prev.filter(s => s.subject !== subjectId);
      } else {
        return [...prev, { subject: subjectId, teachers: [] }];
      }
    });
  };

  const handleTeacherSelect = (subjectId, teacherId) => {
    setSelectedSubjects(prev => prev.map(s =>
      s.subject === subjectId
        ? { ...s, teachers: s.teachers.includes(teacherId)
            ? s.teachers.filter(t => t !== teacherId)
            : [...s.teachers, teacherId] }
        : s
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5050/api/timetables/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          selectedSubjects,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setGeneratedTimetable(result.timetable);
        toast.success('Timetable generated successfully');
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => toast.warn(warning));
        }
      } else {
        toast.error(result.message || 'Failed to generate timetable');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while generating the timetable');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700">Semester</label>
            <input
              type="number"
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="section" className="block text-sm font-medium text-gray-700">Section</label>
            <input
              type="text"
              id="section"
              name="section"
              value={formData.section}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="cluster" className="block text-sm font-medium text-gray-700">Cluster</label>
            <input
              type="text"
              id="cluster"
              name="cluster"
              value={formData.cluster}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Select Subjects and Teachers</label>
          {subjects.map(subject => (
            <div key={subject._id} className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedSubjects.some(s => s.subject === subject._id)}
                  onChange={() => handleSubjectSelect(subject._id)}
                  className="form-checkbox h-5 w-5 text-indigo-600"
                />
                <span className="ml-2">{subject.name}</span>
              </label>
              {selectedSubjects.some(s => s.subject === subject._id) && (
                <div className="ml-6 mt-1">
                  {subject.teachers.map(teacher => (
                    <label key={teacher._id} className="inline-flex items-center mr-4">
                      <input
                        type="checkbox"
                        checked={selectedSubjects.find(s => s.subject === subject._id)?.teachers.includes(teacher._id)}
                        onChange={() => handleTeacherSelect(subject._id, teacher._id)}
                        className="form-checkbox h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm">{teacher.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Generate Timetable
        </button>
      </form>

      {generatedTimetable && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Generated Timetable</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                  {[1, 2, 3, 4, 5, 6, 7].map(slot => (
                    <th key={slot} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slot {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {generatedTimetable.schedule.map(day => (
                  <tr key={day.day}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{day.day}</td>
                    {[1, 2, 3, 4, 5, 6, 7].map(slotNumber => {
                      const slot = day.slots.find(s => s.slotNumber === slotNumber);
                      return (
                        <td key={slotNumber} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {slot ? (
                            <>
                              <div>{slot.subject.name}</div>
                              <div className="text-xs text-gray-400">
                                {slot.teachers.map(t => t.name).join(', ')}
                              </div>
                            </>
                          ) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimetableGenerator;
