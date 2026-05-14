import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { Loader2, BarChart3 } from 'lucide-react'
import api from '../../utils/axios'

export default function AdminReports() {
  const [attendanceData, setAttendanceData] = useState([])
  const [marksData, setMarksData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reports/attendance-summary'),
      api.get('/reports/marks-summary'),
    ])
      .then(([att, marks]) => {
        setAttendanceData(att.data)
        setMarksData(marks.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary-700" />
      </div>
    )
  }

  const attChartData = attendanceData.map((a) => ({
    name: a.code,
    Present: Number(a.present),
    Absent: Number(a.absent),
    Late: Number(a.late),
  }))

  const marksChartData = marksData.reduce((acc, m) => {
    const existing = acc.find((a) => a.subject === m.subject_name)
    if (existing) {
      existing[m.exam_type] = Number(m.avg_score)
    } else {
      acc.push({ subject: m.subject_name, [m.exam_type]: Number(m.avg_score) })
    }
    return acc
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance per Subject</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Average Marks Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={marksChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Mid" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="Final" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" dataKey="Assignment" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  <th className="pb-2">Subject</th>
                  <th className="pb-2">%</th>
                  <th className="pb-2">P</th>
                  <th className="pb-2">A</th>
                  <th className="pb-2">L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendanceData.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="py-2 font-medium">{a.code}</td>
                    <td className="py-2">
                      <span className={`font-medium ${
                        a.percentage >= 75 ? 'text-green-600' : a.percentage >= 65 ? 'text-yellow-600' : 'text-red-600'
                      }`}>{a.percentage}%</span>
                    </td>
                    <td className="py-2 text-green-600">{a.present}</td>
                    <td className="py-2 text-red-600">{a.absent}</td>
                    <td className="py-2 text-yellow-600">{a.late}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Marks Summary (Avg)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  <th className="pb-2">Subject</th>
                  <th className="pb-2">Exam</th>
                  <th className="pb-2">Avg</th>
                  <th className="pb-2">Max</th>
                  <th className="pb-2">Min</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {marksData.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2 font-medium">{m.code}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        m.exam_type === 'Mid' ? 'bg-blue-100 text-blue-700' :
                        m.exam_type === 'Final' ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}>{m.exam_type}</span>
                    </td>
                    <td className="py-2">{m.avg_score}</td>
                    <td className="py-2 text-green-600">{m.max_score}</td>
                    <td className="py-2 text-red-600">{m.min_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
