import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Loader2 } from 'lucide-react'
import api from '../../utils/axios'

export default function AdminReports() {
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/attendance-summary')
      .then((res) => setAttendanceData(res.data))
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance per Subject</h2>
          {attendanceData.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No attendance data available</p>
          ) : (
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
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h2>
        {attendanceData.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No attendance data available</p>
        ) : (
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
        )}
      </div>
    </div>
  )
}
