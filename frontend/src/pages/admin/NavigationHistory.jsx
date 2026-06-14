import { useState, useEffect } from 'react'
import { Search, Loader2, Clock, Filter } from 'lucide-react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'

export default function AdminNavigationHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchHistory = () => {
    setLoading(true)
    const params = {}
    if (search) params.search_query = search
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    api.get('/navigation/history/all', { params })
      .then(res => setHistory(res.data))
      .catch(() => { setHistory([]); toast.error('Failed to load history') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchHistory() }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Navigation Search History</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by query or user..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchHistory()}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            <button onClick={fetchHistory}
              className="px-4 py-2 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-700" /></div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3" />
            <p className="text-sm">No search history found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Search Query</th>
                  <th className="px-4 py-3">Place Found</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{h.user_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{h.search_query}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{h.place_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(h.searched_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
