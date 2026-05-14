import { useState, useEffect } from 'react'
import { Loader2, GraduationCap } from 'lucide-react'
import api from '../../utils/axios'
import { useAuth } from '../../context/AuthContext'

export default function StudentMarks() {
  const { user } = useAuth()
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/marks/${user.id}`)
      .then((res) => setMarks(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user.id])

  const bySubject = {}
  marks.forEach((m) => {
    if (!bySubject[m.subject_id]) bySubject[m.subject_id] = { name: m.subject_name, code: m.subject_code, exams: {} }
    bySubject[m.subject_id].exams[m.exam_type] = { score: m.score, max_score: m.max_score }
  })

  const examTypes = ['Mid', 'Final', 'Assignment']

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary-700" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Marks</h1>

      {Object.keys(bySubject).length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <GraduationCap className="w-16 h-16 mx-auto mb-3" />
          <p>No marks records found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Subject</th>
                  {examTypes.map((t) => <th key={t} className="px-4 py-3 text-center">{t}</th>)}
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.values(bySubject).map((s) => {
                  const totalEarned = Object.values(s.exams).reduce((sum, e) => sum + e.score, 0)
                  const totalMax = Object.values(s.exams).reduce((sum, e) => sum + e.max_score, 0)
                  const pct = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0
                  const grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F'
                  return (
                    <tr key={s.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.code}</p>
                      </td>
                      {examTypes.map((t) => (
                        <td key={t} className="px-4 py-3 text-center">
                          {s.exams[t] ? (
                            <span className={`font-medium ${
                              s.exams[t].score / s.exams[t].max_score >= 0.7 ? 'text-green-600' :
                              s.exams[t].score / s.exams[t].max_score >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                            }`}>{s.exams[t].score}/{s.exams[t].max_score}</span>
                          ) : '-'}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center font-medium">{totalEarned}/{totalMax}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded text-sm font-bold ${
                          grade === 'A' ? 'bg-green-100 text-green-700' :
                          grade === 'B' ? 'bg-blue-100 text-blue-700' :
                          grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                          grade === 'D' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>{grade}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
