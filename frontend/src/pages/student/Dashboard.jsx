import { useState, useEffect } from 'react'
import { Calendar, ClipboardCheck, Bell, Loader2 } from 'lucide-react'
import api from '../../utils/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const dayMap = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' }
const categoryColors = {
  Exam: 'bg-red-100 text-red-700',
  Event: 'bg-blue-100 text-blue-700',
  Holiday: 'bg-green-100 text-green-700',
  General: 'bg-gray-100 text-gray-700',
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [timetable, setTimetable] = useState([])
  const [attendance, setAttendance] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      api.get('/timetable'),
      api.get(`/attendance/student/${user.id}`),
      api.get('/notices'),
    ])
      .then(([tt, att, not]) => {
        setTimetable(tt.data)
        setAttendance(att.data)
        setNotices(not.data.slice(0, 5))
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [user?.id])

  const today = dayMap[new Date().getDay()] || 'Monday'
  const todayClasses = timetable.filter((t) => t.day === today)

  const attBySubject = {}
  attendance.forEach((a) => {
    if (!attBySubject[a.subject_id]) attBySubject[a.subject_id] = { name: a.subject_name, total: 0, present: 0 }
    attBySubject[a.subject_id].total++
    if (a.status === 'Present' || a.status === 'Late') attBySubject[a.subject_id].present++
  })

  const attPercentages = Object.entries(attBySubject).map(([id, data]) => ({
    subject_id: Number(id),
    ...data,
    percentage: Math.round((data.present / data.total) * 100),
  }))

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary-700" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user?.name}!</h1>
      <p className="text-gray-500 mb-6">Here's your academic overview</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Today's Classes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{todayClasses.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center"><Calendar className="w-6 h-6 text-blue-700" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Attendance (Avg)</p>
              <p className="text-2xl font-bold mt-1">{attPercentages.length > 0 ? Math.round(attPercentages.reduce((s, a) => s + a.percentage, 0) / attPercentages.length) : 'N/A'}%</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center"><ClipboardCheck className="w-6 h-6 text-green-700" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Recent Notices</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{notices.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center"><Bell className="w-6 h-6 text-purple-700" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Timetable ({today})</h2>
          {todayClasses.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No classes today</p>
          ) : (
            <div className="space-y-2">
              {todayClasses.map((c) => (
                <div key={c.id} className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-blue-800">{c.subject_name}</p>
                    <p className="text-sm text-blue-600">{c.faculty_name}</p>
                  </div>
                  <div className="text-right text-sm text-blue-600">
                    <p>{c.start_time} - {c.end_time}</p>
                    <p>Room {c.room}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance per Subject</h2>
          {attPercentages.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No attendance records</p>
          ) : (
            <div className="space-y-3">
              {attPercentages.map((a) => (
                <div key={a.subject_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{a.name}</span>
                    <span className={`font-semibold ${
                      a.percentage >= 75 ? 'text-green-600' : a.percentage >= 65 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{a.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        a.percentage >= 75 ? 'bg-green-500' : a.percentage >= 65 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${a.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notices</h2>
        {notices.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No recent notices</p>
        ) : (
          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${categoryColors[n.category]}`}>{n.category}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
