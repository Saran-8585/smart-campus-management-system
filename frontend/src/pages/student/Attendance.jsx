import { useState, useEffect } from 'react'
import { Loader2, ClipboardCheck } from 'lucide-react'
import api from '../../utils/axios'
import { useAuth } from '../../context/AuthContext'

export default function StudentAttendance() {
  const { user } = useAuth()
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/attendance/student/${user.id}`)
      .then((res) => setAttendance(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user.id])

  const bySubject = {}
  attendance.forEach((a) => {
    if (!bySubject[a.subject_id]) bySubject[a.subject_id] = { name: a.subject_name, code: a.subject_code, total: 0, present: 0, absent: 0, late: 0 }
    bySubject[a.subject_id].total++
    bySubject[a.subject_id][a.status.toLowerCase()]++
  })

  const subjectData = Object.values(bySubject).map((s) => ({
    ...s,
    percentage: Math.round(((s.present + s.late) / s.total) * 100),
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Attendance</h1>

      {subjectData.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ClipboardCheck className="w-16 h-16 mx-auto mb-3" />
          <p>No attendance records found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subjectData.map((s) => (
            <div key={s.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <p className="text-sm text-gray-500">{s.code}</p>
                </div>
                <div className={`text-2xl font-bold ${
                  s.percentage >= 75 ? 'text-green-600' : s.percentage >= 65 ? 'text-yellow-600' : 'text-red-600'
                }`}>{s.percentage}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    s.percentage >= 75 ? 'bg-green-500' : s.percentage >= 65 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${s.percentage}%` }}
                />
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>Total: <strong>{s.total}</strong></span>
                <span className="text-green-600">Present: <strong>{s.present}</strong></span>
                <span className="text-red-600">Absent: <strong>{s.absent}</strong></span>
                <span className="text-yellow-600">Late: <strong>{s.late}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
