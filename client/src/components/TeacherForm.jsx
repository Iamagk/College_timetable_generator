import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Search, ArrowUpDown } from 'lucide-react'

function TeacherForm() {
  const [teachers, setTeachers] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    type: 'assistant',
    department: '',
    maxWorkload: 0,
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true
    }
  })
  const [editingId, setEditingId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvailabilityChange = (e) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [name]: checked
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingId
        ? `http://localhost:5050/api/teachers/${editingId}`
        : 'http://localhost:5050/api/teachers'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        await fetchTeachers()
        closeModal()
        toast.success(editingId ? 'Teacher updated successfully' : 'Teacher added successfully')
      } else {
        const errorData = await response.json()
        toast.error(`Failed to ${editingId ? 'update' : 'add'} teacher: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(`An error occurred while ${editingId ? 'updating' : 'adding'} the teacher`)
    }
  }

  const handleEdit = (teacher) => {
    setFormData(teacher)
    setEditingId(teacher._id)
    openModal()
  }

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5050/api/teachers/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchTeachers()
        toast.success('Teacher deleted successfully')
      } else {
        const errorData = await response.json()
        toast.error(`Failed to delete teacher: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred while deleting the teacher')
    }
  }

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({
      name: '',
      type: 'assistant',
      department: '',
      maxWorkload: 0,
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true
      }
    })
    setEditingId(null)
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const sortedAndFilteredTeachers = useMemo(() => {
    return teachers
      .filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1
        if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
  }, [teachers, searchTerm, sortBy, sortOrder])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4 text-center">Teachers List</h2>
        <div className="mb-4 flex items-center space-x-2">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <div className="relative">
            <button
              onClick={() => handleSort(sortBy === 'name' ? 'department' : sortBy === 'department' ? 'type' : 'name')}
              className="px-4 py-2 border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center"
            >
              Sort by {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              <ArrowUpDown className="ml-2" size={16} />
            </button>
          </div>
        </div>
        <div className="bg-white shadow-md rounded-md p-4 h-96 overflow-y-auto">
          <ul className="space-y-4">
            {sortedAndFilteredTeachers.map((teacher) => (
              <li key={teacher._id} className="flex justify-between items-center bg-gray-100 p-4 rounded-md">
                <div>
                  <p className="font-semibold">{teacher.name}</p>
                  <p className="text-sm text-gray-600">{teacher.type} - {teacher.department}</p>
                  <p className="text-sm text-gray-600">Max Workload: {teacher.maxWorkload}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(teacher)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(teacher._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={openModal}
          className="mt-4 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full"
        >
          Add Teacher
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-md shadow-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">{editingId ? 'Edit' : 'Add'} Teacher</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                  <option value="assistant">Assistant</option>
                  <option value="associate">Associate</option>
                  <option value="senior">Senior</option>
                </select>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="maxWorkload" className="block text-sm font-medium text-gray-700">Max Workload</label>
                <input
                  type="number"
                  id="maxWorkload"
                  name="maxWorkload"
                  value={formData.maxWorkload}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700">Availability</label>
              <div className="mt-2 space-y-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => (
                    <div key={day} className="flex items-center">
                    <input
                        type="checkbox"
                        id={day}
                        name={day}
                        checked={formData.availability[day]}
                        onChange={handleAvailabilityChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={day} className="ml-2 block text-sm text-gray-900 capitalize">
                        {day}
                    </label>
                    </div>
                ))}
            </div>
            </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {editingId ? 'Update' : 'Add'} Teacher
              </button>
            </form>
            <button
              onClick={closeModal}
              className="mt-4 w-full py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherForm
