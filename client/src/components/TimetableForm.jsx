import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

function TimetableForm() {
  const [timetables, setTimetables] = useState([])
  const [subjects, setSubjects] = useState([])
  const [formData, setFormData] = useState({
    semester: 1,
    department: '',
    section: '',
    cluster: '',
    schedule: [
      { day: 'Monday', slots: Array(9).fill(null) },
      { day: 'Tuesday', slots: Array(9).fill(null) },
      { day: 'Wednesday', slots: Array(9).fill(null) },
      { day: 'Thursday', slots: Array(9).fill(null) },
      { day: 'Friday', slots: Array(9).fill(null) },
    ]
  })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchTimetables()
    fetchSubjects(formData.semester)
  }, [formData.semester])

  const fetchTimetables = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/timetables')
      if (response.ok) {
        const data = await response.json()
        setTimetables(data)
      } else {
        toast.error('Failed to fetch timetables')
      }
    } catch (error) {
      console.error('Error fetching timetables:', error)
      toast.error('Error fetching timetables')
    }
  }

  const fetchSubjects = async (semester) => {
    try {
      const response = await fetch(`http://localhost:5050/api/subjects/semester/${semester}`)
      if (response.ok) {
        const data = await response.json()
        setSubjects(data)
      } else {
        toast.error('Failed to fetch subjects')
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
      toast.error('Error fetching subjects')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === 'semester') {
      fetchSubjects(value)
    }
  }

  const handleSlotChange = (dayIndex, slotIndex, field, value) => {
    setFormData(prev => {
      const newSchedule = [...prev.schedule];
      if (!newSchedule[dayIndex].slots[slotIndex]) {
        newSchedule[dayIndex].slots[slotIndex] = { slotNumber: slotIndex + 1 };
      }
      newSchedule[dayIndex].slots[slotIndex] = {
        ...newSchedule[dayIndex].slots[slotIndex],
        [field]: value
      };
      if (field === 'subject') {
        newSchedule[dayIndex].slots[slotIndex].teachers = [];
        const selectedSubject = subjects.find(s => s._id === value);
        if (selectedSubject && selectedSubject.type === 'lab' && slotIndex < 8) {
          // If it's a lab subject, occupy the next slot as well
          newSchedule[dayIndex].slots[slotIndex + 1] = { ...newSchedule[dayIndex].slots[slotIndex], slotNumber: slotIndex + 2 };
        }
      }
      return { ...prev, schedule: newSchedule };
    })
  }

  const handleTeacherChange = (dayIndex, slotIndex, selectedTeachers) => {
    setFormData(prev => {
      const newSchedule = [...prev.schedule]
      if (!newSchedule[dayIndex].slots[slotIndex]) {
        newSchedule[dayIndex].slots[slotIndex] = { slotNumber: slotIndex + 1, teachers: [] }
      }
      newSchedule[dayIndex].slots[slotIndex].teachers = selectedTeachers
      return { ...prev, schedule: newSchedule }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanedTimetable = {
      ...formData,
      schedule: formData.schedule.map(day => ({
        ...day,
        slots: day.slots.filter(slot => slot && slot.subject)
      }))
    }
    try {
      const url = editingId
        ? `http://localhost:5050/api/timetables/${editingId}`
        : 'http://localhost:5050/api/timetables'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedTimetable),
      })
      const result = await response.json()
      if (response.ok) {
        fetchTimetables()
        setFormData({
          semester: 1,
          department: '',
          section: '',
          cluster: '',
          schedule: [
            { day: 'Monday', slots: Array(9).fill(null) },
            { day: 'Tuesday', slots: Array(9).fill(null) },
            { day: 'Wednesday', slots: Array(9).fill(null) },
            { day: 'Thursday', slots: Array(9).fill(null) },
            { day: 'Friday', slots: Array(9).fill(null) },
          ]
        })
        setEditingId(null)
        toast.success(editingId ? 'Timetable updated successfully' : 'Timetable created successfully')

        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            toast.warn(warning, {
              autoClose: false,
              closeOnClick: false,
            })
          })
        }
      } else {
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(error => toast.error(error))
        } else {
          toast.error(result.message || 'An error occurred while saving the timetable')
        }
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            toast.warn(warning, {
              autoClose: false,
              closeOnClick: false,
            })
          })
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred while saving the timetable')
    }
  }

  const handleEdit = (timetable) => {
    const fullSchedule = timetable.schedule.map(day => ({
      ...day,
      slots: Array(9).fill(null).map((_, index) => {
        const existingSlot = day.slots.find(slot => slot.slotNumber === index + 1);
        return existingSlot || { slotNumber: index + 1, subject: null, teachers: [] };
      })
    }));

    setFormData({
      ...timetable,
      schedule: fullSchedule
    });
    setEditingId(timetable._id);
    toast.info('Editing timetable. Make your changes and click Update.');
  }

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5050/api/timetables/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchTimetables()
        toast.success('Timetable deleted successfully')
      } else {
        const errorData = await response.json()
        toast.error(`Failed to delete timetable: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred while deleting the timetable')
    }
  }

  const getSlotTime = (slotNumber) => {
    const slotTimes = [
      '08:30', // 1st slot
      '09:30', // 2nd slot
      '10:30', // Tea break
      '10:50', // 4th slot
      '11:50', // 5th slot
      '12:50', // Lunch break
      '1:45', // 7th slot
      '2:40', // 8th slot
      '3:35', // 9th slot
    ];

    const endTime = slotNumber === 9 ? '4:30' : slotTimes[slotNumber];

    return `${slotTimes[slotNumber - 1]} - ${endTime}`;
  }

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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900">Schedule</h3>
          {formData.schedule.map((day, dayIndex) => (
            <div key={day.day} className="mt-4">
              <h4 className="text-md font-medium text-gray-700">{day.day}</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-9 mt-2">
                {day.slots.map((slot, slotIndex) => (
                  <div key={slotIndex} className="space-y-2">
                    {(slotIndex !== 2 && slotIndex !== 5) ? (
                      <>
                        <select
                          value={slot?.subject || ''}
                          onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'subject', e.target.value)}
                          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">Select subject</option>
                          {subjects.map(subject => (
                            <option key={subject._id} value={subject._id}>
                              {subject.name} ({subject.type})
                            </option>
                          ))}
                        </select>
                        {slot?.subject && (
                          <select
                            multiple
                            value={slot.teachers || []}
                            onChange={(e) => handleTeacherChange(dayIndex, slotIndex, Array.from(e.target.selectedOptions, option => option.value))}
                            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            {subjects.find(s => s._id === slot.subject)?.teachers.map(teacher => (
                              <option key={teacher._id} value={teacher._id}>
                                {teacher.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    ) : (
                      <div className="py-2 px-3 bg-gray-100 rounded-md text-sm text-gray-500">
                        {slotIndex === 2 ? 'Tea Break (20 min)' : 'Lunch Break (1 hour)'}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">{getSlotTime(slotIndex + 1)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {editingId ? 'Update' : 'Create'} Timetable
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900">Existing Timetables</h3>
        <div className="mt-4 space-y-4">
          {timetables.map(timetable => (
            <div key={timetable._id} className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {timetable.department} - Semester {timetable.semester} - Section {timetable.section}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Cluster: {timetable.cluster || 'N/A'}
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  {timetable.schedule.map(day => (
                    <div key={day.day} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">{day.day}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {day.slots.map(slot => (
                          <div key={slot.slotNumber} className="mb-2">
                            Slot {slot.slotNumber} ({getSlotTime(slot.slotNumber)}):
                            {slot.subject ? (
                              <>
                                {slot.subject.name} ({slot.teachers?.map(t => t.name).join(', ')})
                              </>
                            ) : (
                              slot.slotNumber === 3 ? 'Tea Break' :
                              slot.slotNumber === 6 ? 'Lunch Break' :
                              'Not assigned'
                            )}
                          </div>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  onClick={() => handleEdit(timetable)}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(timetable._id)}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TimetableForm
