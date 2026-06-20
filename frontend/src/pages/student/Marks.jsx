import { useState, useEffect } from 'react'
import { Loader2, ClipboardCheck } from 'lucide-react'
import api from '../../utils/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function StudentMarks() {
  const { user } = useAuth()
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    api.get(`/marks/student/${user.id}`)
      .then((res) => setMarks(res.data))
      .catch(() => toast.error('Failed to load marks'))
      .finally(() => setLoading(false))
  }, [user?.id])

  const bySubject = {}
  marks.forEach((m) => {
    if (!bySubject[m.subject_id]) {
      bySubject[m.subject_id] = { name: m.subject_name, code: m.subject_code, exams: [] }
    }
    bySubject[m.subject_id].exams.push(m)
  })

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary-700" />
      </div>
    )
  }

  const subjectData = Object.values(bySubject)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Marks</h1>

      {subjectData.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ClipboardCheck className="w-16 h-16 mx-auto mb-3" />
          <p>No marks records found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subjectData.map((s) => (
            <div key={s.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">{s.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{s.code}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b">
                      <th className="px-3 py-2">Exam</th>
                      <th className="px-3 py-2">Marks</th>
                      <th className="px-3 py-2">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {s.exams.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{e.exam_type}</td>
                        <td className="px-3 py-2 font-medium">{e.marks_obtained} / {e.max_marks}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            (e.marks_obtained / e.max_marks) >= 0.75
                              ? 'bg-green-100 text-green-700'
                              : (e.marks_obtained / e.max_marks) >= 0.5
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {Math.round((e.marks_obtained / e.max_marks) * 100)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
