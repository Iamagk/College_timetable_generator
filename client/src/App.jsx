import { useState } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import TeacherForm from './components/TeacherForm'
import SubjectForm from './components/SubjectForm'
import TimetableForm from './components/TimetableForm'
import TimetableView from './components/TimeTableView'
import TeacherTimetableView from './components/TeacherTimetableView'
import TimetableGenerator from './components/TimetableGenerator'
import Sidebar from './components/Sidebar'

function App() {
  const [activeComponent, setActiveComponent] = useState('teachers')

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'teachers':
        return <TeacherForm />
      case 'subjects':
        return <SubjectForm />
      case 'timetables':
        return <TimetableForm />
      case 'view-timetable':
        return <TimetableView />
      case 'teacher-timetable':
        return <TeacherTimetableView />
      case 'generate-timetable':
        return <TimetableGenerator />
      default:
        return <TeacherForm />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar setActiveComponent={setActiveComponent} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div className="container mx-auto px-6 py-8">
          <h3 className="text-gray-700 text-3xl font-medium mb-6">Timetable Management System</h3>
          {renderActiveComponent()}
        </div>
      </main>
      <ToastContainer />
    </div>
  )
}

export default App
