import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

function TeacherTimetableView() {
  const [teachers, setTeachers] = useState([])
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [timetable, setTimetable] = useState(null)

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/teachers')
      if (response.ok) {
        const data = await response.json()
        setTeachers(data)
      } else {
        toast.error('Failed to fetch teachers')
      }
    } catch (error) {
      console.error('Error fetching teachers:', error)
      toast.error('Error fetching teachers')
    }
  }

  const fetchTeacherTimetable = async (teacherId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/timetables/teacher/${teacherId}`)
      if (response.ok) {
        const data = await response.json()
        setTimetable(data)
      } else {
        toast.error('Failed to fetch teacher timetable')
      }
    } catch (error) {
      console.error('Error fetching teacher timetable:', error)
      toast.error('Error fetching teacher timetable')
    }
  }

  const handleTeacherChange = (e) => {
    const teacherId = e.target.value
    setSelectedTeacher(teacherId)
    if (teacherId) {
      fetchTeacherTimetable(teacherId)
    } else {
      setTimetable(null)
    }
  }

  const getSlotTime = (slotNumber) => {
    const startTime = new Date(0, 0, 0, 8, 30)
    startTime.setHours(startTime.getHours() + slotNumber - 1)
    if (slotNumber > 2) startTime.setMinutes(startTime.getMinutes() + 20) // Tea break
    if (slotNumber > 4) startTime.setHours(startTime.getHours() + 1) // Lunch break
    return startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="teacher-select" className="block text-sm font-medium text-gray-700">Select Teacher</label>
        <select
          id="teacher-select"
          value={selectedTeacher}
          onChange={handleTeacherChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Select a teacher</option>
          {teachers.map(teacher => (
            <option key={teacher._id} value={teacher._id}>
              {teacher.name}
            </option>
          ))}
        </select>
      </div>

      {timetable && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Timetable for {teachers.find(t => t._id === selectedTeacher)?.name}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                  {[1, 2, 3, 4, 5, 6, 7].map(slot => (
                    <th key={slot} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slot {slot}
                      <br />
                      <span className="text-xs font-normal">{getSlotTime(slot)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <tr key={day}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{day}</td>
                    {[1, 2, 3, 4, 5, 6, 7].map(slotNumber => {
                      const slot = timetable.find(t => t.day === day && t.slotNumber === slotNumber)
                      return (
                        <td key={slotNumber} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {slot ? (
                            <>
                              <div>{slot.subject.name}</div>
                              <div className="text-xs text-gray-400">{slot.timetableInfo}</div>
                            </>
                          ) : slotNumber === 3 ? (
                            <div className="text-xs text-gray-400">Tea Break</div>
                          ) : slotNumber === 5 ? (
                            <div className="text-xs text-gray-400">Lunch Break</div>
                          ) : '-'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherTimetableView
