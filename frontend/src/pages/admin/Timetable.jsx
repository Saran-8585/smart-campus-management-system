import { useState, useEffect } from 'react'
import { Search, Plus, X, Loader2, Calendar, Trash2, Edit, ToggleLeft, ToggleRight, Download, History } from 'lucide-react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const semesters = [1,2,3,4,5,6,7,8]

export default function AdminTimetable() {
  const [entries, setEntries] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ subject_id: '', day: 'Monday', start_time: '09:00', end_time: '10:30', room: '', semester: 3, faculty_name: '', department: '', section: '' })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [showInactive, setShowInactive] = useState(false)
  const [semesterFilter, setSemesterFilter] = useState('')
  const [historyModal, setHistoryModal] = useState(false)
  const [historyRoom, setHistoryRoom] = useState('')
  const [historyData, setHistoryData] = useState([])

  const fetchData = () => {
    setLoading(true)
    const params = showInactive ? '?include_inactive=true' : ''
    Promise.all([
      api.get(`/timetable${params}`),
      api.get('/subjects'),
    ])
      .then(([tt, subs]) => {
        setEntries(tt.data)
        setSubjects(subs.data)
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [showInactive])

  const filtered = entries.filter((e) => {
    const matchSearch = e.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.room?.toLowerCase().includes(search.toLowerCase()) ||
      (e.faculty_name || '').toLowerCase().includes(search.toLowerCase())
    const matchSemester = !semesterFilter || e.semester === Number(semesterFilter)
    return matchSearch && matchSemester
  })

  const groupedByDay = days.map((day) => ({
    day,
    entries: filtered.filter((e) => e.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }))

  const openAdd = () => {
    setEditing(null)
    setForm({ subject_id: '', day: 'Monday', start_time: '09:00', end_time: '10:30', room: '', semester: 3, faculty_name: '', department: '', section: '' })
    setShowForm(true)
  }

  const openEdit = (entry) => {
    setEditing(entry)
    setForm({
      subject_id: entry.subject_id,
      day: entry.day,
      start_time: entry.start_time,
      end_time: entry.end_time,
      room: entry.room,
      semester: entry.semester,
      faculty_name: entry.faculty_name || '',
      department: entry.department || '',
      section: entry.section || '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.subject_id || !form.room) { toast.error('Subject and room are required'); return }
    if (form.start_time >= form.end_time) { toast.error('End time must be after start time'); return }
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/timetable/${editing.id}`, form)
        toast.success('Entry updated (history preserved)')
      } else {
        await api.post('/timetable', form)
        toast.success('Entry added')
      }
      setShowForm(false)
      setEditing(null)
      setForm({ subject_id: '', day: 'Monday', start_time: '09:00', end_time: '10:30', room: '', semester: 3, faculty_name: '', department: '', section: '' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/timetable/${deleteId}`)
      toast.success('Entry deactivated')
      setDeleteId(null)
      fetchData()
    } catch {
      toast.error('Failed to deactivate')
    }
  }

  const viewHistory = async (room) => {
    setHistoryRoom(room)
    setHistoryModal(true)
    try {
      const res = await api.get(`/timetable/history?room=${room}`)
      setHistoryData(res.data)
    } catch {
      toast.error('Failed to load history')
      setHistoryData([])
    }
  }

  const exportCSV = () => {
    const headers = ['Day', 'Start Time', 'End Time', 'Subject', 'Faculty', 'Department', 'Section', 'Room', 'Semester', 'Active']
    const rows = entries.map(e => [
      e.day, e.start_time, e.end_time, e.subject_name, e.faculty_name || '',
      e.department || '', e.section || '', e.room, e.semester,
      e.is_active ? 'Yes' : 'No'
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'timetable.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Timetable Manager</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showInactive ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
            {showInactive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            Show Inactive
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by subject, room, or faculty..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">All Semesters</option>
              {semesters.map((s) => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-700" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No timetable entries found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-px bg-gray-200">
            {groupedByDay.map(({ day, entries: dayEntries }) => (
              <div key={day} className="bg-white">
                <div className="bg-primary-700 text-white text-center py-2 text-sm font-semibold">{day}</div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {dayEntries.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No classes</p>
                  ) : (
                    dayEntries.map((e) => (
                      <div key={e.id} className={`rounded-lg p-2 text-xs relative group ${
                        e.is_active ? 'bg-primary-50' : 'bg-yellow-50 border border-yellow-200'
                      }`}>
                        <p className="font-medium text-primary-800 truncate">{e.subject_name}</p>
                        <p className="text-primary-600">{e.start_time} - {e.end_time}</p>
                        <p className="text-primary-500">Room {e.room}</p>
                        {e.faculty_name && <p className="text-gray-500 truncate">{e.faculty_name}</p>}
                        {e.section && <p className="text-gray-400 text-[10px]">{e.section}</p>}
                        {!e.is_active && <p className="text-yellow-600 text-[10px] font-medium">Inactive</p>}
                        {e.is_active && (
                          <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(e)}
                              className="p-1 bg-white rounded shadow text-blue-500 hover:text-blue-700">
                              <Edit className="w-3 h-3" />
                            </button>
                            <button onClick={() => setDeleteId(e.id)}
                              className="p-1 bg-white rounded shadow text-red-500 hover:text-red-700">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History button */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center justify-center">
            <button onClick={() => { setHistoryRoom(''); setHistoryModal(true) }}
              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium">
              <History className="w-4 h-4" /> View Classroom History
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Deactivate Timetable Entry"
        message="This will soft-deactivate this entry (history preserved). Continue?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Timetable Slot' : 'Add Timetable Slot'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">Select subject</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  {days.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                    {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Name</label>
                <input value={form.faculty_name} onChange={(e) => setForm({ ...form, faculty_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Classroom History</h2>
              <button onClick={() => setHistoryModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-4">
              <input type="text" placeholder="Enter classroom number (e.g. J101)"
                value={historyRoom} onChange={(e) => setHistoryRoom(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && historyRoom.trim()) {
                    try {
                      const res = await api.get(`/timetable/history?room=${historyRoom.trim().toUpperCase()}`)
                      setHistoryData(res.data)
                    } catch { toast.error('Failed to load history') }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            {historyData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No history found for this classroom. Enter a room number and press Enter.</p>
            ) : (
              <div className="space-y-2">
                {historyData.map((h, idx) => (
                  <div key={h.id} className={`p-3 rounded-lg text-sm ${h.is_active ? 'bg-primary-50 border border-primary-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{h.subject_name}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {h.is_active ? 'Active' : 'Historical'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">v{historyData.length - idx}</span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">{h.day} · {h.start_time} - {h.end_time} · Room {h.room}</p>
                    {h.faculty_name && <p className="text-gray-500 text-xs">Faculty: {h.faculty_name} · {h.department || ''} · {h.section || ''}</p>}
                    {h.deactivated_at && <p className="text-yellow-600 text-[10px]">Deactivated: {new Date(h.deactivated_at).toLocaleString()}</p>}
                    {h.updated_by_name && <p className="text-gray-400 text-[10px]">Updated by: {h.updated_by_name}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
