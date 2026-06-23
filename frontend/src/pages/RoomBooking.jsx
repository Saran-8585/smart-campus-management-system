import { useState, useEffect } from 'react'
import { Calendar, Clock, Plus, X, Loader2, CheckCircle2, XCircle, AlertCircle, User, Building2 } from 'lucide-react'
import api from '../utils/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function RoomBooking() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ room_id: '', title: '', purpose: '', date: '', start_time: '', end_time: '' })

  const loadData = async () => {
    setLoading(true)
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        api.get('/rooms'),
        isAdmin ? api.get('/rooms/bookings/all') : api.get('/rooms/bookings/mine'),
      ])
      setRooms(roomsRes.data.filter(r => r.status === 'Active'))
      setBookings(bookingsRes.data)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleBook = async (e) => {
    e.preventDefault()
    if (!form.room_id || !form.title || !form.date || !form.start_time || !form.end_time) {
      toast.error('All fields are required'); return
    }
    if (form.start_time >= form.end_time) { toast.error('End time must be after start time'); return }
    setSaving(true)
    try {
      await api.post('/rooms/bookings', form)
      toast.success('Booking request submitted')
      setShowForm(false)
      setForm({ room_id: '', title: '', purpose: '', date: '', start_time: '', end_time: '' })
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book')
    } finally {
      setSaving(false)
    }
  }

  const handleReview = async (id, status) => {
    try {
      await api.patch(`/rooms/bookings/${id}/review`, { status })
      toast.success(`Booking ${status.toLowerCase()}`)
      loadData()
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleCancel = async (id) => {
    try {
      await api.patch(`/rooms/bookings/${id}/cancel`, {})
      toast.success('Booking cancelled')
      loadData()
    } catch {
      toast.error('Failed to cancel')
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const nowTime = new Date().toTimeString().slice(0, 5)

  const statusBadge = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-700',
      Approved: 'bg-green-100 text-green-700',
      Rejected: 'bg-red-100 text-red-700',
      Cancelled: 'bg-gray-100 text-gray-500',
      Completed: 'bg-blue-100 text-blue-700',
    }
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Room Booking</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 text-sm font-medium">
          <Plus className="w-4 h-4" /> Book Room
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mx-auto"></div></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No bookings yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{b.title}</h3>
                  <p className="text-sm text-gray-500">{b.room_id?.name} · {b.room_id?.block}</p>
                </div>
                {statusBadge(b.status)}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {b.start_time} - {b.end_time}</span>
              </div>
              {b.purpose && <p className="text-sm text-gray-500 mb-2">{b.purpose}</p>}
              {b.booked_by && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <User className="w-3 h-3" /> Booked by: {b.booked_by.name} ({b.booked_by.email})
                </p>
              )}
              {b.remarks && <p className="text-xs text-gray-400 mt-1">Remarks: {b.remarks}</p>}

              <div className="flex gap-2 mt-3">
                {b.status === 'Pending' && isAdmin && (
                  <>
                    <button onClick={() => handleReview(b._id, 'Approved')}
                      className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium">
                      Approve
                    </button>
                    <button onClick={() => handleReview(b._id, 'Rejected')}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium">
                      Reject
                    </button>
                  </>
                )}
                {(b.status === 'Pending' || b.status === 'Approved') && b.booked_by?._id === user?.id && (
                  <button onClick={() => handleCancel(b._id)}
                    className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Book a Room</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <select value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required>
                  <option value="">Select a room</option>
                  {rooms.map(r => <option key={r._id} value={r._id}>{r.name} ({r.block})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose (optional)</label>
                <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} min={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:opacity-60 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Booking...' : 'Book Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
