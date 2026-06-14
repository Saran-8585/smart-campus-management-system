import { useState, useEffect } from 'react'
import { Loader2, Save, ClipboardCheck, Search } from 'lucide-react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const statusColors = {
  Present: 'bg-green-100 text-green-700 border-green-300',
  Absent: 'bg-red-100 text-red-700 border-red-300',
  Late: 'bg-yellow-100 text-yellow-700 border-yellow-300',
}

export default function FacultyAttendance() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [records, setRecords] = useState({})
  const [existingRecords, setExistingRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [viewHistory, setViewHistory] = useState(false)

  useEffect(() => {
    api.get('/subjects').then((res) => setSubjects(res.data)).catch(() => toast.error('Failed to load subjects'))
  }, [])

  useEffect(() => {
    if (!selectedSubject || !date) return
    setLoading(true)
    api.get(`/attendance/${selectedSubject}?date=${date}`)
      .then((res) => {
        setStudents(res.data.students)
        setExistingRecords(res.data.records)
        const map = {}
        for (const r of res.data.records) {
          map[r.student_id] = r.status
        }
        setRecords(map)
      })
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false))
  }, [selectedSubject, date])

  const setStatus = (studentId, status) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleSave = async () => {
    const recordsPayload = students.map((s) => ({
      student_id: s.id,
      status: records[s.id] || 'Absent',
    }))
    setSaving(true)
    try {
      await api.post('/attendance', { subject_id: Number(selectedSubject), date, records: recordsPayload })
      toast.success('Attendance saved')
      const res = await api.get(`/attendance/${selectedSubject}?date=${date}`)
      setStudents(res.data.students)
      setExistingRecords(res.data.records)
      const map = {}
      for (const r of res.data.records) {
        map[r.student_id] = r.status
      }
      setRecords(map)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const subjectName = subjects.find((s) => s.id === Number(selectedSubject))?.name || ''

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance Manager</h1>

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
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search students..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
          <button onClick={() => { setViewHistory(!viewHistory); setSearch('') }}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              viewHistory ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}>
            {viewHistory ? 'Mark Attendance' : 'View History'}
          </button>
        </div>
      </div>

      {!selectedSubject ? (
        <div className="text-center py-20 text-gray-400">
          <ClipboardCheck className="w-16 h-16 mx-auto mb-3" />
          <p>Select a subject and date to manage attendance</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-700" /></div>
      ) : viewHistory ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-medium text-gray-900">Attendance History for {subjectName}</h2>
          </div>
          {existingRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-400"><p>No records found for this date</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {existingRecords.map((r) => {
                    const student = students.find((s) => s.id === r.student_id)
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{student?.name || 'Unknown'}</td>
                        <td className="px-4 py-3">{r.date}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[r.status]}`}>{r.status}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-medium text-gray-900">{subjectName} — {date}</h2>
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
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((s, i) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {['Present', 'Absent', 'Late'].map((status) => (
                            <button
                              key={status}
                              onClick={() => setStatus(s.id, status)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                records[s.id] === status
                                  ? statusColors[status]
                                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
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
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
