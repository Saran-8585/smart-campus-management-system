import { useState, useEffect } from 'react'
import { Users, BookOpen, Bell, UserCheck } from 'lucide-react'
import api from '../../utils/axios'
import StatCard from '../../components/StatCard'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, faculty: 0, subjects: 0, notices: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/users?role=student'),
      api.get('/users?role=faculty'),
      api.get('/subjects'),
      api.get('/notices'),
    ])
      .then(([students, faculty, subjects, notices]) => {
        setStats({
          students: students.data.length,
          faculty: faculty.data.length,
          subjects: subjects.data.length,
          notices: notices.data.length,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={stats.students} color="blue" />
        <StatCard icon={UserCheck} label="Total Faculty" value={stats.faculty} color="green" />
        <StatCard icon={BookOpen} label="Total Subjects" value={stats.subjects} color="purple" />
        <StatCard icon={Bell} label="Total Notices" value={stats.notices} color="orange" />
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">System Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Departments</span>
                <span className="font-medium">CSE, ECE</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Semesters Active</span>
                <span className="font-medium">3, 5, 7</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Admin Accounts</span>
                <span className="font-medium">2</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Recent Activity</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="py-1">System initialized with seed data</p>
              <p className="py-1">All modules ready for use</p>
              <p className="py-1">Attendance, Marks, Timetable loaded</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
