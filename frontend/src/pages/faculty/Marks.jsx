import { useState, useEffect } from 'react'
import { Loader2, Save, ClipboardCheck } from 'lucide-react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'

const examTypes = ['Mid', 'Final', 'Assignment']

export default function FacultyMarks() {
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [examType, setExamType] = useState('Mid')
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [maxMarks, setMaxMarks] = useState(100)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/subjects').then((res) => setSubjects(res.data)).catch(() => toast.error('Failed to load subjects'))
  }, [])

  useEffect(() => {
    if (!selectedSubject) return
    setLoading(true)
    api.get(`/marks/subject/${selectedSubject}?exam_type=${examType}`)
      .then((res) => {
        setStudents(res.data.students)
        const map = {}
        for (const r of res.data.records) {
          map[r.student_id] = r.marks_obtained
        }
        setMarks(map)
      })
      .catch(() => toast.error('Failed to load marks'))
      .finally(() => setLoading(false))
  }, [selectedSubject, examType])

  const setMark = (studentId, value) => {
    const num = Math.min(maxMarks, Math.max(0, Number(value) || 0))
    setMarks((prev) => ({ ...prev, [studentId]: num }))
  }

  const handleSave = async () => {
    const recordsPayload = students.map((s) => ({
      student_id: s.id,
      marks_obtained: marks[s.id] || 0,
      max_marks: maxMarks,
    }))
    setSaving(true)
    try {
      await api.post('/marks', { subject_id: selectedSubject, exam_type: examType, records: recordsPayload })
      toast.success('Marks saved')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Marks Entry</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">Select subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
            <select value={examType} onChange={(e) => setExamType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              {examTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
            <input type="number" value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value) || 100)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div className="relative flex-1">
            <input type="text" placeholder="Search students..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
        </div>
      </div>

      {!selectedSubject ? (
        <div className="text-center py-20 text-gray-400">
          <ClipboardCheck className="w-16 h-16 mx-auto mb-3" />
          <p>Select a subject and exam type to manage marks</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-700" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-medium text-gray-900">{examType} Marks</h2>
            <span className="text-sm text-gray-500">{students.length} students</span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-400"><p>No students enrolled</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Marks (out of {maxMarks})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((s, i) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" max={maxMarks}
                          value={marks[s.id] ?? ''}
                          onChange={(e) => setMark(s.id, e.target.value)}
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-4 py-3 border-t flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60 text-sm font-medium">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
