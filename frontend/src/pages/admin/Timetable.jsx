import { useState, useEffect } from 'react'
import { Search, Plus, X, Loader2, Calendar, Trash2 } from 'lucide-react'
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
  const [form, setForm] = useState({ subject_id: '', day: 'Monday', start_time: '09:00', end_time: '10:30', room: '', semester: 3 })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/timetable'),
      api.get('/subjects'),
    ])
      .then(([tt, subs]) => {
        setEntries(tt.data)
        setSubjects(subs.data)
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const filtered = entries.filter((e) =>
    e.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.room?.toLowerCase().includes(search.toLowerCase())
  )

  const groupedByDay = days.map((day) => ({
    day,
    entries: filtered.filter((e) => e.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }))

  const handleSave = async () => {
    if (!form.subject_id || !form.room) { toast.error('Subject and room are required'); return }
    setSaving(true)
    try {
      await api.post('/timetable', form)
      toast.success('Entry added')
      setShowForm(false)
      setForm({ subject_id: '', day: 'Monday', start_time: '09:00', end_time: '10:30', room: '', semester: 3 })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/timetable/${deleteId}`)
      toast.success('Entry deleted')
      setDeleteId(null)
      fetchData()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Timetable Manager</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Slot
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search timetable..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
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
                      <div key={e.id} className="bg-primary-50 rounded-lg p-2 text-xs relative group">
                        <p className="font-medium text-primary-800 truncate">{e.subject_name}</p>
                        <p className="text-primary-600">{e.start_time} - {e.end_time}</p>
                        <p className="text-primary-500">Room {e.room}</p>
                        <button onClick={() => setDeleteId(e.id)}
                          className="absolute top-1 right-1 p-1 bg-white rounded shadow opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Timetable Entry"
        message="Are you sure you want to delete this entry?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Timetable Slot</h2>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
