import { useState, useEffect } from 'react'
import { Search, Plus, X, Loader2, Bell } from 'lucide-react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'

const categories = ['Exam', 'Event', 'Holiday', 'General']
const categoryColors = {
  Exam: 'bg-red-100 text-red-700',
  Event: 'bg-blue-100 text-blue-700',
  Holiday: 'bg-green-100 text-green-700',
  General: 'bg-gray-100 text-gray-700',
}

export default function FacultyNotices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', category: 'General', target_role: 'all' })
  const [saving, setSaving] = useState(false)

  const fetchNotices = () => {
    setLoading(true)
    api.get('/notices')
      .then((res) => setNotices(res.data))
      .catch(() => toast.error('Failed to load notices'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchNotices() }, [])

  const filtered = notices.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async () => {
    if (!form.title || !form.body) { toast.error('Title and body are required'); return }
    setSaving(true)
    try {
      await api.post('/notices', form)
      toast.success('Notice posted')
      setShowForm(false)
      setForm({ title: '', body: '', category: 'General', target_role: 'all' })
      fetchNotices()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notice Board</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Post Notice
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search notices..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-700" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No notices found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((n) => (
              <div key={n.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[n.category]}`}>{n.category}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{n.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-2">By {n.poster_name} · {new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Post New Notice</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                  <select value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="all">Everyone</option>
                    <option value="student">Students Only</option>
                    <option value="faculty">Faculty Only</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Posting...' : 'Post Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
