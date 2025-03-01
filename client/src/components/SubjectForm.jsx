import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Search, ArrowUpDown } from 'lucide-react'

const BACKEND_URL = "https://college-timetable-generator.onrender.com"; // Updated backend URL

function SubjectForm() {
  const [subjects, setSubjects] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'core',
    department: '',
    semester: '',
    weeklyHours: 0
  })
  const [editingId, setEditingId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [reload, setReload] = useState(false) // To trigger UI updates

  useEffect(() => {
    fetchSubjects()
  }, [reload])

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/subjects`)
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

  const refreshData = () => setReload(prev => !prev)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingId
        ? `${BACKEND_URL}/api/subjects/${editingId}`
        : `${BACKEND_URL}/api/subjects`
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        refreshData()
        closeModal()
        toast.success(editingId ? 'Subject updated successfully' : 'Subject added successfully')
      } else {
        const errorData = await response.json()
        toast.error(`Failed to ${editingId ? 'update' : 'add'} subject: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(`An error occurred while ${editingId ? 'updating' : 'adding'} the subject`)
    }
  }

  const handleEdit = (subject) => {
    setFormData(subject)
    setEditingId(subject._id)
    openModal()
  }

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/subjects/${id}`, { method: 'DELETE' })
      if (response.ok) {
        refreshData()
        toast.success('Subject deleted successfully')
      } else {
        const errorData = await response.json()
        toast.error(`Failed to delete subject: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred while deleting the subject')
    }
  }

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({
      name: '',
      code: '',
      type: 'core',
      department: '',
      semester: '',
      weeklyHours: 0
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

  const sortedAndFilteredSubjects = useMemo(() => {
    return subjects
      .filter(subject =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1
        if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
  }, [subjects, searchTerm, sortBy, sortOrder])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4 text-center">Subjects List</h2>
        <div className="mb-4 flex items-center space-x-2">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-md p-4 h-96 overflow-y-auto">
          <ul className="space-y-4">
            {sortedAndFilteredSubjects.map((subject) => (
              <li key={subject._id} className="flex justify-between items-center bg-gray-100 p-4 rounded-md">
                <div>
                  <p className="font-semibold">{subject.name} ({subject.code})</p>
                  <p className="text-sm text-gray-600">{subject.type} - {subject.department}</p>
                  <p className="text-sm text-gray-600">Semester: {subject.semester}</p>
                  <p className="text-sm text-gray-600">Weekly Hours: {subject.weeklyHours}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(subject)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(subject._id)} className="text-red-600 hover:underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <button onClick={openModal} className="mt-4 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full">Add Subject</button>
      </div>
    </div>
  )
}

export default SubjectForm