import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function SubjectForm() {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: 0,
    semester: 1,
    department: '',
    teachers: [],
    type: 'theory',
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('');

  useEffect(() => {
    fetchSubjects();
    fetchTeachers();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/subjects');
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

  const fetchTeachers = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      } else {
        toast.error('Failed to fetch teachers');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Error fetching teachers');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTeacherChange = (e) => {
    const selectedTeachers = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, teachers: selectedTeachers }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `http://localhost:5050/api/subjects/${editingId}`
        : 'http://localhost:5050/api/subjects';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        await fetchSubjects();
        setFormData({
          name: '',
          code: '',
          credits: 0,
          semester: 1,
          department: '',
          teachers: [],
          type: 'theory',
        });
        setEditingId(null);
        setShowForm(false);
        toast.success(
          editingId ? 'Subject updated successfully' : 'Subject added successfully'
        );
      } else {
        const errorData = await response.json();
        toast.error(
          `Failed to ${editingId ? 'update' : 'add'} subject: ${errorData.message}`
        );
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(
        `An error occurred while ${editingId ? 'updating' : 'adding'} the subject`
      );
    }
  };

  const handleEdit = (subject) => {
    setFormData(subject);
    setEditingId(subject._id);
    setShowForm(true);
    toast.info('Editing subject. Make your changes and click Update.');
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5050/api/subjects/${id}`,
        {
          method: 'DELETE',
        }
      );
      if (response.ok) {
        await fetchSubjects();
        toast.success('Subject deleted successfully');
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete subject: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while deleting the subject');
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const handleSort = (field) => {
    setSortField(field);
    setSubjects((prevSubjects) => {
      const sortedSubjects = [...prevSubjects];
      sortedSubjects.sort((a, b) => {
        if (a[field] < b[field]) return -1;
        if (a[field] > b[field]) return 1;
        return 0;
      });
      return sortedSubjects;
    });
  };

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery)
  );

  return (
    <div className="relative">
      <div className="flex justify-center items-center h-screen">
        <div className="w-full max-w-6xl">
          <h2 className="text-2xl font-semibold mb-4 text-center">Subjects List</h2>

          {/* Search bar */}
          <div className="mb-4 flex justify-between items-center">
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-1/3 p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />

            {/* Sort buttons */}
            <div className="flex space-x-2">
              {['name', 'semester', 'credits', 'department', 'type'].map((field) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Sort by {field.charAt(0).toUpperCase() + field.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable box for subjects table */}
          <div className="overflow-x-auto shadow-md border border-gray-300 rounded-lg max-h-[500px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubjects.map((subject) => (
                  <tr key={subject._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{subject.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{subject.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{subject.credits}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{subject.semester}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{subject.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{subject.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(subject._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-6xl py-4 px-6 border border-transparent rounded-lg shadow-md text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Add Subject
      </button>

      {showForm && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-md max-w-md w-full space-y-4"
          >
            <h3 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Subject' : 'Add New Subject'}
            </h3>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Code
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Credits
                </label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Semester
                </label>
                <input
                  type="number"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="block w-full p-2 border border-gray-300 rounded-md shadow
-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Teachers
              </label>
              <select
                name="teachers"
                multiple
                value={formData.teachers}
                onChange={handleTeacherChange}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="theory">Theory</option>
                <option value="lab">Lab</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    name: '',
                    code: '',
                    credits: 0,
                    semester: 1,
                    department: '',
                    teachers: [],
                    type: 'theory',
                  });
                }}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SubjectForm;
