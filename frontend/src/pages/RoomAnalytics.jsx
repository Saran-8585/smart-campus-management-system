import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download, BarChart3, Building2, Users as UsersIcon } from 'lucide-react'
import api from '../utils/axios'
import toast from 'react-hot-toast'

export default function RoomAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('utilization')

  useEffect(() => {
    api.get('/rooms/data/utilization')
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  const exportData = () => {
    if (!data) return
    const rows = [['Room', 'Block', 'Capacity', 'Weekly Slots', 'Utilization %']]
    for (const r of data.rooms) {
      rows.push([r.name, r.block, r.capacity, r.total_weekly_slots, r.utilization_percent])
    }
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'room_utilization.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mx-auto"></div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">Failed to load analytics</div>
  }

  const rooms = [...data.rooms].sort((a, b) => {
    if (sortBy === 'utilization') return b.utilization_percent - a.utilization_percent
    if (sortBy === 'capacity') return b.capacity - a.capacity
    if (sortBy === 'slots') return b.total_weekly_slots - a.total_weekly_slots
    return a.name.localeCompare(b.name)
  })

  const chartData = rooms.map(r => ({
    name: r.name,
    utilization: r.utilization_percent,
    capacity: r.capacity,
  }))

  const avgUtil = Math.round(rooms.reduce((s, r) => s + r.utilization_percent, 0) / rooms.length)
  const highUtil = rooms.filter(r => r.utilization_percent > 70).length
  const lowUtil = rooms.filter(r => r.utilization_percent < 30).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Room Utilization Analytics</h1>
        <button onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 text-sm font-medium">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Average Utilization</p>
          <p className="text-2xl font-bold text-primary-700">{avgUtil}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">High Usage (&gt;70%)</p>
          <p className="text-2xl font-bold text-amber-600">{highUtil} rooms</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Low Usage (&lt;30%)</p>
          <p className="text-2xl font-bold text-blue-600">{lowUtil} rooms</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Utilization by Room (%)</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
            <YAxis unit="%" />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="utilization" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Utilization %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Room Details</h2>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none">
            <option value="utilization">Sort by Utilization</option>
            <option value="capacity">Sort by Capacity</option>
            <option value="slots">Sort by Slots</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="text-left px-4 py-3 font-medium">Room</th>
                <th className="text-left px-4 py-3 font-medium">Block</th>
                <th className="text-center px-4 py-3 font-medium">Capacity</th>
                <th className="text-center px-4 py-3 font-medium">Weekly Slots</th>
                <th className="text-center px-4 py-3 font-medium">Used (min)</th>
                <th className="text-center px-4 py-3 font-medium">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map(r => (
                <tr key={r.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.block}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{r.capacity}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{r.total_weekly_slots}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{r.used_minutes}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${
                          r.utilization_percent > 70 ? 'bg-green-500' : r.utilization_percent > 30 ? 'bg-amber-500' : 'bg-blue-500'
                        }`} style={{ width: `${r.utilization_percent}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{r.utilization_percent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
