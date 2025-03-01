import { useState, useEffect } from 'react'
import { usePDF } from 'react-to-pdf'

function TimetableView() {
  const [timetables, setTimetables] = useState([])
  const [selectedTimetable, setSelectedTimetable] = useState(null)
  const { toPDF, targetRef } = usePDF({ filename: 'timetable.pdf'})

  useEffect(() => {
    fetchTimetables()
  }, [])

  const fetchTimetables = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/timetables')
      if (response.ok) {
        const data = await response.json()
        setTimetables(data)
      }
    } catch (error) {
      console.error('Error fetching timetables:', error)
    }
  }

  const handleTimetableSelect = (event) => {
    const selected = timetables.find(t => t._id === event.target.value)
    setSelectedTimetable(selected)
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="timetable-select" className="block text-sm font-medium text-gray-700">Select Timetable</label>
        <select
          id="timetable-select"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          onChange={handleTimetableSelect}
        >
          <option value="">Select a timetable</option>
          {timetables.map(timetable => (
            <option key={timetable._id} value={timetable._id}>
              {timetable.department} - Semester {timetable.semester} - Section {timetable.section}
            </option>
          ))}
        </select>
      </div>

      {selectedTimetable && (
        <>
          <div ref={targetRef} className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Timetable for {selectedTimetable.department} - Semester {selectedTimetable.semester} - Section {selectedTimetable.section}
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                    {[1, 2, 'Tea Break', 3, 4, 'Lunch Break', 5, 6, 7].map((slot, index) => (
                      <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {typeof slot === 'number' ? `Slot ${slot}` : slot}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedTimetable.schedule.map(day => (
                    <tr key={day.day}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{day.day}</td>
                      {[1, 2].map((slot, index) => {
                        const subjectSlot = day.slots.find(s => s.slotNumber === slot)
                        return (
                          <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subjectSlot ? (
                              <div>
                                <p>{subjectSlot.subject.name}</p>
                                {/* <p className="text-xs text-gray-400">{subjectSlot.teachers.map(t => t.name).join(', ')}</p> */}
                              </div>
                            ) : '-'}
                          </td>
                        )
                      })}
                      {/* Tea Break column spanning across all rows */}
                      <td className="px-6 py-4 text-center text-sm text-gray-500" colSpan="1" >
                        Tea Break<br />10:30 - 10:50
                      </td>
                      {[3, 4].map((slot, index) => {
                        const subjectSlot = day.slots.find(s => s.slotNumber === slot)
                        return (
                          <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subjectSlot ? (
                              <div>
                                <p>{subjectSlot.subject.name}</p>
                                {/* <p className="text-xs text-gray-400">{subjectSlot.teachers.map(t => t.name).join(', ')}</p> */}
                              </div>
                            ) : '-'}
                          </td>
                        )
                      })}
                      {/* Lunch Break column spanning across all rows */}
                      <td className="px-6 py-4 text-center text-sm text-gray-500" colSpan="1">
                        Lunch Break<br />12:50 - 1:45
                      </td>
                      {[5, 6, 7].map((slot, index) => {
                        const subjectSlot = day.slots.find(s => s.slotNumber === slot)
                        return (
                          <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subjectSlot ? (
                              <div>
                                <p>{subjectSlot.subject.name}</p>
                                {/* <p className="text-xs text-gray-400">{subjectSlot.teachers.map(t => t.name).join(', ')}</p> */}
                              </div>
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
          <div className="mt-4">
            <button
              onClick={() => toPDF()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Download as PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default TimetableView
