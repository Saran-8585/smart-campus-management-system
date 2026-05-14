import { useState, useEffect } from 'react'
import { BookOpen, Calendar, ClipboardCheck, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../utils/axios'
import StatCard from '../../components/StatCard'
import { useAuth } from '../../context/AuthContext'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function FacultyDashboard() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/subjects'),
      api.get('/timetable'),
    ])
      .then(([subs, tt]) => {
        setSubjects(subs.data)
        setTimetable(tt.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const today = days[new Date().getDay() === 0 ? 5 : new Date().getDay() - 1] || 'Monday'
  const todayClasses = timetable.filter((t) => t.day === today)

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={BookOpen} label="My Subjects" value={subjects.length} color="blue" />
        <StatCard icon={Calendar} label="Weekly Classes" value={timetable.length} color="green" />
        <StatCard icon={ClipboardCheck} label="Today's Classes" value={todayClasses.length} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Classes ({today})</h2>
          {todayClasses.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No classes scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {todayClasses.map((c) => (
                <div key={c.id} className="bg-primary-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary-800">{c.subject_name}</p>
                    <p className="text-sm text-primary-600">{c.start_time} - {c.end_time} | Room {c.room}</p>
                  </div>
                  <Link to="/faculty/attendance"
                    className="text-sm text-primary-700 hover:text-primary-900 font-medium">
                    Mark Attendance
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

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
                    <div className="flex gap-2">
                      <Link to="/faculty/attendance"
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Attendance</Link>
                      <Link to="/faculty/marks"
                        className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100">Marks</Link>
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
