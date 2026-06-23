import { useState, useEffect } from 'react'
import { Search, MapPin, Users, Clock, Wifi, Monitor, CheckCircle2, XCircle, AlertTriangle, Building2 } from 'lucide-react'
import api from '../utils/axios'
import toast from 'react-hot-toast'

const blockColors = {
  'J Block': 'border-l-blue-500',
  'A Block': 'border-l-emerald-500',
  'B Block': 'border-l-amber-500',
  'Central Block': 'border-l-purple-500',
}

export default function RoomDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [blockFilter, setBlockFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const fetchDashboard = () => {
    setLoading(true)
    api.get('/rooms/data/dashboard')
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load room dashboard'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDashboard() }, [])

  const rooms = data?.rooms || []
  const filtered = rooms.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.block?.toLowerCase().includes(search.toLowerCase())
    const matchBlock = !blockFilter || r.block === blockFilter
    const matchType = !typeFilter || r.room_type === typeFilter
    return matchSearch && matchBlock && matchType
  })

  const blocks = [...new Set(rooms.map(r => r.block))]
  const types = [...new Set(rooms.map(r => r.room_type))]

  const totalRooms = rooms.length
  const occupied = rooms.filter(r => r.current_class).length
  const free = totalRooms - occupied

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Room Dashboard</h1>
        <button onClick={fetchDashboard} disabled={loading}
          className="px-3 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60">
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total Rooms</p>
            <p className="text-2xl font-bold text-gray-900">{totalRooms}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Occupied Now</p>
            <p className="text-2xl font-bold text-green-600">{occupied}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Available Now</p>
            <p className="text-2xl font-bold text-gray-600">{free}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search rooms..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <select value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            <option value="">All Blocks</option>
            {blocks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            <option value="">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mx-auto"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No rooms found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(room => (
            <div key={room._id || room.name}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${blockColors[room.block] || 'border-l-gray-300'} p-4 hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{room.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {room.block} · {room.floor}
                  </p>
                </div>
                {room.current_class ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                    <XCircle className="w-3 h-3" /> Occupied
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    <CheckCircle2 className="w-3 h-3" /> Free
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {room.capacity}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {room.room_type}</span>
              </div>

              {room.facilities?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {room.facilities.slice(0, 3).map((f, i) => (
                    <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{f}</span>
                  ))}
                  {room.facilities.length > 3 && (
                    <span className="text-[10px] text-gray-400">+{room.facilities.length - 3}</span>
                  )}
                </div>
              )}

              {room.current_class ? (
                <div className="bg-red-50 rounded-lg p-2 mt-2">
                  <p className="text-xs font-medium text-red-800 truncate">{room.current_class.subject_name}</p>
                  <p className="text-[10px] text-red-600">{room.current_class.faculty_name} · {room.current_class.section}</p>
                  <p className="text-[10px] text-red-500">{room.current_class.start_time} - {room.current_class.end_time}</p>
                </div>
              ) : (
                <div className="bg-green-50 rounded-lg p-2 mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-green-700">Available</span>
                  {room.upcoming_count > 0 && (
                    <span className="text-[10px] text-green-600">{room.upcoming_count} upcoming</span>
                  )}
                </div>
              )}

              {room.status === 'Maintenance' && (
                <div className="flex items-center gap-1 text-xs text-amber-600 mt-2">
                  <AlertTriangle className="w-3 h-3" /> Under Maintenance
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
