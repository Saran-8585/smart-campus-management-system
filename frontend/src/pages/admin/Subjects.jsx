import { useState, useEffect } from 'react'
import { Search, Plus, X, Loader2, BookOpen, Edit, Trash2 } from 'lucide-react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([])
  const [facultyList, setFacultyList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', department: 'CSE', semester: 3, credits: 3, faculty_id: '' })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/subjects'),
      api.get('/users?role=faculty'),
    ])
      .then(([subs, fac]) => {
        setSubjects(subs.data)
        setFacultyList(fac.data)
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = (subject) => {
    setEditing(subject)
    setForm({
      name: subject.name,
      code: subject.code,
      department: subject.department,
      semester: subject.semester,
      credits: subject.credits,
      faculty_id: subject.faculty_id ? String(subject.faculty_id) : '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.code || !form.department || !form.semester) {
      toast.error('Name, code, department, and semester are required')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/subjects/${editing.id}`, { ...form, faculty_id: form.faculty_id || null })
        toast.success('Subject updated')
      } else {
        await api.post('/subjects', { ...form, faculty_id: form.faculty_id || null })
        toast.success('Subject created')
      }
      setShowForm(false)
      setEditing(null)
      setForm({ name: '', code: '', department: 'CSE', semester: 3, credits: 3, faculty_id: '' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/subjects/${deleteId}`)
      toast.success('Subject deactivated')
      setDeleteId(null)
      fetchData()
    } catch {
      toast.error('Failed to deactivate')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subject Management</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search subjects..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-700" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No subjects found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3">Faculty</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-primary-700">{s.code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.semester}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.credits}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.faculty_name || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(s)} className="text-sm text-primary-600 hover:text-primary-800 mr-3"><Edit className="w-3.5 h-3.5 inline" /> Edit</button>
                      <button onClick={() => setDeleteId(s.id)} className="text-sm text-red-600 hover:text-red-800"><Trash2 className="w-3.5 h-3.5 inline" /> Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Subject' : 'Add Subject'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                <input type="number" min="1" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Faculty</label>
                <select value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">Unassigned</option>
                  {facultyList.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.department})</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving...' : editing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Deactivate Subject"
        message="This will deactivate the subject. Timetable and enrollment records will be preserved but the subject will no longer appear in active listings."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
