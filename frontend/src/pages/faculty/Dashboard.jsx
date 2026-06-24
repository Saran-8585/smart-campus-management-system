import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Loader2 } from 'lucide-react'
import api from '../../utils/axios'
import StatCard from '../../components/StatCard'
import toast from 'react-hot-toast'

export default function FacultyDashboard() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/subjects')
      .then((res) => setSubjects(res.data))
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary-700" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Faculty Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 mb-8">
        <StatCard icon={BookOpen} label="My Subjects" value={subjects.length} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Subjects</h2>
          {subjects.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No subjects assigned</p>
          ) : (
            <div className="space-y-3">
              {subjects.map((s) => (
                <div key={s.id} className="border border-gray-200 rounded-lg p-3 hover:border-primary-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.code} | Sem {s.semester} | {s.credits} Credits</p>
                    </div>
                    <div>
                      <Link to="/faculty/attendance"
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Attendance</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
