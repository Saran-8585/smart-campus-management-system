import { useState, useEffect } from 'react'
import { Loader2, ClipboardCheck } from 'lucide-react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'

const examTypes = ['Mid', 'Final', 'Assignment']
const semesters = [1, 2, 3, 4, 5, 6, 7, 8]

export default function AdminMarks() {
  const [marks, setMarks] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [subjectFilter, setSubjectFilter] = useState('')
  const [examFilter, setExamFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/subjects'),
    ])
      .then(([subs]) => setSubjects(subs.data))
      .catch(() => toast.error('Failed to load'))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (subjectFilter) params.set('subject_id', subjectFilter)
    if (examFilter) params.set('exam_type', examFilter)
    if (semesterFilter) params.set('semester', semesterFilter)
    const qs = params.toString()
    api.get(`/marks${qs ? `?${qs}` : ''}`)
      .then((res) => setMarks(res.data))
      .catch(() => toast.error('Failed to load marks'))
      .finally(() => setLoading(false))
  }, [subjectFilter, examFilter, semesterFilter])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Marks Overview</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex gap-3">
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
          <select value={examFilter} onChange={(e) => setExamFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="">All Exams</option>
            {examTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="">All Semesters</option>
            {semesters.map((s) => <option key={s} value={s}>Sem {s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-700" /></div>
      ) : marks.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ClipboardCheck className="w-16 h-16 mx-auto mb-3" />
          <p>No marks records found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b bg-gray-50">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Exam</th>
                <th className="px-4 py-3">Marks</th>
                <th className="px-4 py-3">Percentage</th>
                <th className="px-4 py-3">Semester</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {marks.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.student_name || 'Unknown'}</td>
                  <td className="px-4 py-3">{m.subject_name || 'Unknown'}</td>
                  <td className="px-4 py-3">{m.exam_type}</td>
                  <td className="px-4 py-3">{m.marks_obtained} / {m.max_marks}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      (m.marks_obtained / m.max_marks) >= 0.75
                        ? 'bg-green-100 text-green-700'
                        : (m.marks_obtained / m.max_marks) >= 0.5
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {Math.round((m.marks_obtained / m.max_marks) * 100)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">Sem {m.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
