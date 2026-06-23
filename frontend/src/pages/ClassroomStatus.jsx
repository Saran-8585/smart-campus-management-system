import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Clock, Calendar, CheckCircle2, XCircle, Download, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../utils/axios'
import toast from 'react-hot-toast'

export default function ClassroomStatus() {
  const [room, setRoom] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [timelineData, setTimelineData] = useState(null)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const intervalRef = useRef(null)

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!room.trim()) { toast.error('Enter a classroom number'); return }
    const roomNo = room.trim().toUpperCase()
    setLoading(true)
    try {
      const res = await api.get(`/classroom/status?room=${roomNo}`)
      setResult(res.data)
      // Also fetch timeline
      setLoadingTimeline(true)
      try {
        const tl = await api.get(`/rooms/data/timeline?room=${roomNo}`)
        setTimelineData(tl.data)
        setShowTimeline(true)
      } catch {
        // timeline is secondary
      } finally {
        setLoadingTimeline(false)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch status')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatusOnly = useCallback(async () => {
    if (!room.trim()) return
    try {
      const res = await api.get(`/classroom/status?room=${room.trim().toUpperCase()}`)
      setResult(res.data)
    } catch {
      // silent on auto-refresh
    }
  }, [room])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchStatusOnly, 15000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, fetchStatusOnly])

  const exportSchedule = async () => {
    if (!room.trim()) { toast.error('Search a room first'); return }
    try {
      const res = await api.get(`/rooms/data/export?room=${room.trim().toUpperCase()}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url; a.download = `schedule_${room.trim().toUpperCase()}.csv`; a.click()
      URL.revokeObjectURL(url)
      toast.success('Schedule exported')
    } catch {
      toast.error('Failed to export')
    }
  }

  const getTimelineEntryStyle = (entry) => {
    if (!timelineData) return ''
    const cs = timeToMinutes(entry.start_time)
    const ce = timeToMinutes(entry.end_time)
    const cm = timeToMinutes(timelineData.current_time)
    if (cm >= cs && cm < ce) return 'bg-green-100 border-green-300 ring-2 ring-green-400'
    if (ce <= cm) return 'bg-gray-50 border-gray-200 text-gray-400'
    return 'bg-blue-50 border-blue-200'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Classroom Status</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              autoRefresh ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto (15s)
          </button>
          <button onClick={exportSchedule}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

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

          {/* Full Day Timeline */}
          {timelineData && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <button
                onClick={() => setShowTimeline(!showTimeline)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Full Day Timeline — {timelineData.day}
                  <span className="text-xs font-normal text-gray-400 ml-2">({timelineData.total} classes)</span>
                </h3>
                {showTimeline ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {showTimeline && (
                <div className="mt-4 space-y-2">
                  {timelineData.past?.length === 0 && !timelineData.current && timelineData.upcoming?.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No classes scheduled today</p>
                  )}
                  {timelineData.current && (
                    <div className={`p-3 rounded-lg border text-sm ${getTimelineEntryStyle(timelineData.current)}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-green-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> NOW
                        </span>
                        <span className="text-green-700 font-medium">{timelineData.current.start_time} - {timelineData.current.end_time}</span>
                      </div>
                      <p className="font-medium text-gray-900 mt-1">{timelineData.current.subject_name}</p>
                      <p className="text-xs text-gray-500">{timelineData.current.faculty_name} · {timelineData.current.section}</p>
                    </div>
                  )}
                  {timelineData.upcoming?.map((entry, idx) => (
                    <div key={`up-${idx}`} className={`p-3 rounded-lg border text-sm ${getTimelineEntryStyle(entry)}`}>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">{entry.subject_name}</span>
                        <span className="text-blue-700 font-medium">{entry.start_time} - {entry.end_time}</span>
                      </div>
                      <p className="text-xs text-gray-500">{entry.faculty_name} · {entry.section}</p>
                    </div>
                  ))}
                  {timelineData.past?.map((entry, idx) => (
                    <div key={`past-${idx}`} className={`p-3 rounded-lg border text-sm ${getTimelineEntryStyle(entry)}`}>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">{entry.subject_name}</span>
                        <span className="text-gray-400">{entry.start_time} - {entry.end_time}</span>
                      </div>
                      <p className="text-xs text-gray-400">{entry.faculty_name} · {entry.section}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {loadingTimeline && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-700 mx-auto"></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
