import { useState, useEffect } from 'react'
import { Search, Bell, Filter } from 'lucide-react'
import api from '../../utils/axios'

const categories = ['All', 'Exam', 'Event', 'Holiday', 'General']
const categoryColors = {
  Exam: 'bg-red-100 text-red-700',
  Event: 'bg-blue-100 text-blue-700',
  Holiday: 'bg-green-100 text-green-700',
  General: 'bg-gray-100 text-gray-700',
}

export default function StudentNotices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  useEffect(() => {
    api.get('/notices')
      .then((res) => setNotices(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = notices.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || n.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notice Board</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search notices..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div className="flex gap-2">
              <Filter className="w-5 h-5 text-gray-400 self-center" />
              {categories.map((c) => (
                <button key={c} onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    categoryFilter === c
                      ? 'bg-primary-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bell className="w-16 h-16 mx-auto mb-3" />
            <p>No notices found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((n) => (
              <div key={n.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[n.category]}`}>{n.category}</span>
                </div>
                <h3 className="text-base font-semibold text-gray-900">{n.title}</h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{n.body}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  <span>Posted by {n.poster_name}</span>
                  <span>{new Date(n.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
