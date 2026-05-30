import { useState } from 'react'
import { Search, Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import api from '../utils/axios'
import toast from 'react-hot-toast'

export default function ClassroomStatus() {
  const [room, setRoom] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!room.trim()) { toast.error('Enter a classroom number'); return }
    setLoading(true)
    try {
      const res = await api.get(`/classroom/status?room=${room.trim().toUpperCase()}`)
      setResult(res.data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Classroom Status</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Enter classroom number (e.g. J101, A203)"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 transition-colors disabled:opacity-60 flex items-center gap-2 text-sm"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mx-auto"></div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Current status card */}
          {result.current ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-green-800">{room.toUpperCase()} - Current Class</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Class In Progress
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Subject</p>
                  <p className="font-medium text-gray-900">{result.current.subject_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Faculty</p>
                  <p className="font-medium text-gray-900">{result.current.faculty_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Department</p>
                  <p className="font-medium text-gray-900">{result.current.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Section</p>
                  <p className="font-medium text-gray-900">{result.current.section || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Time</p>
                  <p className="font-medium text-gray-900">{result.current.start_time} — {result.current.end_time}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-800">{room.toUpperCase()}</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
                  <XCircle className="w-3.5 h-3.5" />
                  Classroom Available
                </span>
              </div>
              <p className="text-gray-500 text-sm">No class currently scheduled in this classroom</p>
            </div>
          )}

          {/* Upcoming today */}
          {result.upcoming_today && result.upcoming_today.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming Today
              </h3>
              <div className="space-y-2">
                {result.upcoming_today.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-primary-700">{entry.start_time} — {entry.end_time}</span>
                      <span className="text-gray-700">{entry.subject_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      <span>{entry.faculty_name || 'N/A'}</span>
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{entry.section || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
