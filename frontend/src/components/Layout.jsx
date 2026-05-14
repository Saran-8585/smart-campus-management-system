import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, Bell, Calendar, BarChart3,
  ClipboardCheck, GraduationCap, UserCircle, LogOut, Menu, X,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const roleMenus = {
  admin: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { label: 'Notices', path: '/admin/notices', icon: Bell },
    { label: 'Timetable', path: '/admin/timetable', icon: Calendar },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
  ],
  faculty: [
    { label: 'Dashboard', path: '/faculty', icon: LayoutDashboard },
    { label: 'Attendance', path: '/faculty/attendance', icon: ClipboardCheck },
    { label: 'Marks', path: '/faculty/marks', icon: GraduationCap },
    { label: 'Notices', path: '/faculty/notices', icon: Bell },
    { label: 'Students', path: '/faculty/students', icon: Users },
  ],
  student: [
    { label: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { label: 'Timetable', path: '/student/timetable', icon: Calendar },
    { label: 'Attendance', path: '/student/attendance', icon: ClipboardCheck },
    { label: 'Marks', path: '/student/marks', icon: GraduationCap },
    { label: 'Notices', path: '/student/notices', icon: Bell },
    { label: 'Profile', path: '/student/profile', icon: UserCircle },
  ],
}

const roleColors = {
  admin: 'bg-purple-100 text-purple-800',
  faculty: 'bg-blue-100 text-blue-800',
  student: 'bg-green-100 text-green-800',
}

export default function Layout({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const menuItems = roleMenus[role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === `/${role}`) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-primary-700 text-white
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:min-h-screen flex flex-col
        `}
      >
        <div className="p-5 border-b border-primary-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Smart Campus</h1>
              <p className="text-xs text-primary-200">Digital System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-5 py-3 mx-2 rounded-lg transition-colors
                  ${active
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-primary-200 hover:bg-white/10 hover:text-white'}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm">{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-primary-600">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
              {user?.name?.charAt(0)}
            </div>
            <div className="text-sm truncate">
              <p className="font-medium truncate">{user?.name}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${roleColors[role]}`}>
                {role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-primary-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:inline">{user?.email}</span>
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
