import {useState } from 'react';

function Sidebar({ setActiveComponent }) {
  const [isOpen, setIsOpen] = useState(false); // State to manage sidebar visibility

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item) => {
    setActiveComponent(item);
    setIsOpen(false); // Collapse sidebar after selecting an option
  };

  return (
    <div className="relative flex">
      {/* Sidebar */}
      <div
        className={`flex flex-col bg-gray-800 transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-0'
        } overflow-hidden h-screen`}
      >
        <div className="flex items-center h-20 px-4 shadow-md">
          <h1 className={`text-3xl uppercase text-white flex-1 text-center ${isOpen ? 'block' : 'hidden'}`}>TMS</h1>
          {isOpen && (
            <button
              className="text-white focus:outline-none ml-4"
              onClick={toggleMenu}
            >
              <svg
                className="w-6 h-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
        </div>

        <ul className={`flex flex-col py-4 ${isOpen ? 'block' : 'hidden'}`}>
          {['teachers', 'subjects', 'timetables', 'view-timetable', 'teacher-timetable','generate-timetable'].map((item) => (
            <li key={item}>
              <a
                href="#"
                className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-500 hover:text-gray-200"
                onClick={() => handleItemClick(item)}
              >
                <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                  <i className="bx bx-home"></i>
                </span>
                <span className={`text-sm font-medium capitalize ${isOpen ? 'block' : 'hidden'}`}>
                  {item.replace('-', ' ')}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Hamburger Menu Button always visible */}
      {!isOpen && (
        <button
          className="absolute top-4 left-4 bg-gray-800 p-2 rounded focus:outline-none flex items-center justify-center z-50"
          onClick={toggleMenu}
        >
          <svg
            className="w-6 h-6 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Sidebar;
