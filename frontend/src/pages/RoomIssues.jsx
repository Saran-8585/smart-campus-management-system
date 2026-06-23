import { useState, useEffect } from 'react'
import { AlertTriangle, Plus, X, Loader2, CheckCircle2, Clock, Wrench, Building2 } from 'lucide-react'
import api from '../utils/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const categories = ['Electrical', 'Plumbing', 'Furniture', 'Equipment', 'Cleaning', 'Other']
const priorities = ['Low', 'Medium', 'High', 'Critical']
const statuses = ['Open', 'In Progress', 'Resolved', 'Closed']

const priorityColors = {
  Low: 'bg-blue-50 text-blue-700',
  Medium: 'bg-yellow-50 text-yellow-700',
  High: 'bg-orange-50 text-orange-700',
  Critical: 'bg-red-50 text-red-700',
}

const statusColors = {
  Open: 'bg-red-50 text-red-700',
  'In Progress': 'bg-blue-50 text-blue-700',
  Resolved: 'bg-green-50 text-green-700',
  Closed: 'bg-gray-100 text-gray-600',
}

export default function RoomIssues() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [rooms, setRooms] = useState([])
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState({ status: '', room_id: '' })
  const [form, setForm] = useState({ room_id: '', category: 'Electrical', description: '', priority: 'Medium' })

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.status) params.set('status', filter.status)
      if (filter.room_id) params.set('room_id', filter.room_id)
      const [roomsRes, issuesRes] = await Promise.all([
        api.get('/rooms'),
        api.get(`/rooms/issues?${params}`),
      ])
      setRooms(roomsRes.data)
      setIssues(issuesRes.data)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [filter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.room_id || !form.description) { toast.error('Room and description are required'); return }
    setSaving(true)
    try {
      await api.post('/rooms/issues', form)
      toast.success('Issue reported')
      setShowForm(false)
      setForm({ room_id: '', category: 'Electrical', description: '', priority: 'Medium' })
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusUpdate = async (id, status, resolution_notes) => {
    try {
      await api.patch(`/rooms/issues/${id}/status`, { status, resolution_notes: resolution_notes || '' })
      toast.success(`Issue marked as ${status}`)
      loadData()
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Room Issues</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 text-sm font-medium">
          <Plus className="w-4 h-4" /> Report Issue
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filter.room_id} onChange={(e) => setFilter({ ...filter, room_id: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            <option value="">All Rooms</option>
            {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mx-auto"></div></div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No issues reported</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map(issue => (
            <div key={issue._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${issue.priority === 'Critical' ? 'text-red-500' : issue.priority === 'High' ? 'text-orange-500' : 'text-yellow-500'}`} />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{issue.room_id?.name} · {issue.category}</h3>
                    <p className="text-xs text-gray-500">{issue.room_id?.block}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[issue.priority]}`}>{issue.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[issue.status]}`}>{issue.status}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(issue.createdAt).toLocaleDateString()}</span>
                {issue.reported_by && <span>Reported by: {issue.reported_by.name}</span>}
                {issue.resolved_by && <span>Resolved by: {issue.resolved_by?.name}</span>}
              </div>
              {issue.resolution_notes && (
                <p className="text-xs text-green-600 mt-1">Resolution: {issue.resolution_notes}</p>
              )}

              {isAdmin && issue.status !== 'Closed' && (
                <div className="flex gap-2 mt-3">
                  {issue.status === 'Open' && (
                    <button onClick={() => handleStatusUpdate(issue._id, 'In Progress')}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">
                      Mark In Progress
                    </button>
                  )}
                  {(issue.status === 'Open' || issue.status === 'In Progress') && (
                    <button onClick={() => {
                      const notes = prompt('Resolution notes (optional):')
                      handleStatusUpdate(issue._id, 'Resolved', notes || '')
                    }}
                      className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium">
                      Mark Resolved
                    </button>
                  )}
                  {issue.status === 'Resolved' && (
                    <button onClick={() => handleStatusUpdate(issue._id, 'Closed')}
                      className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium">
                      Close
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Report Issue</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <select value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required>
                  <option value="">Select a room</option>
                  {rooms.map(r => <option key={r._id} value={r._id}>{r.name} ({r.block})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:opacity-60 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Submitting...' : 'Report Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
