import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Navigation, Clock, RotateCcw, Trash2, Loader2 } from 'lucide-react'
import api from '../utils/axios'
import toast from 'react-hot-toast'

export default function CampusNavigation() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [recentSearches, setRecentSearches] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    api.get('/navigation/history').then(res => setRecentSearches(res.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/navigation/search?q=${encodeURIComponent(query)}`)
        setSuggestions(res.data)
        setShowSuggestions(res.data.length > 0)
      } catch { setSuggestions([]) }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectPlace = async (place) => {
    setQuery(place.name)
    setShowSuggestions(false)
    setLoading(true)
    try {
      const res = await api.get(`/navigation/place/${place.id}`)
      setSelectedPlace(res.data)
      api.post('/navigation/history', { search_query: place.name, place_id: place.id, place_name: place.name }).catch(() => {})
      const histRes = await api.get('/navigation/history')
      setRecentSearches(histRes.data || [])
    } catch (err) {
      toast.error('Failed to load place details')
    } finally {
      setLoading(false)
    }
  }

  const handleReSearch = (place) => {
    selectPlace(place)
  }

  const clearHistory = async () => {
    try {
      await api.delete('/navigation/history')
      setRecentSearches([])
      toast.success('History cleared')
    } catch { toast.error('Failed to clear') }
  }

  const campusBlocks = [
    { name: 'J Block', x: 60, y: 25, w: 18, h: 25, color: '#93c5fd' },
    { name: 'A Block', x: 10, y: 40, w: 18, h: 30, color: '#fdba74' },
    { name: 'B Block', x: 30, y: 60, w: 18, h: 20, color: '#86efac' },
    { name: 'Central Block', x: 35, y: 30, w: 20, h: 22, color: '#c4b5fd' },
    { name: 'Library', x: 35, y: 18, w: 12, h: 10, color: '#fde68a' },
    { name: 'Auditorium', x: 50, y: 18, w: 14, h: 10, color: '#fca5a5' },
    { name: 'Sports Ground', x: 65, y: 10, w: 20, h: 12, color: '#6ee7b7' },
    { name: 'Boys Hostel', x: 72, y: 0, w: 14, h: 9, color: '#a5b4fc' },
    { name: 'Girls Hostel', x: 20, y: 68, w: 14, h: 12, color: '#f9a8d4' },
    { name: 'Canteen', x: 30, y: 22, w: 8, h: 6, color: '#d1d5db' },
    { name: 'Parking', x: 30, y: 82, w: 20, h: 10, color: '#9ca3af' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Campus Navigation</h1>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="relative" ref={searchRef}>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Search for a place (e.g. Library, J101, Canteen)"
          />
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPlace(p)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                >
                  <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.block || ''} {p.floor ? `- ${p.floor}` : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Recent Searches + Detail */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Recent Searches
                </h3>
                <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s, i) => (
                  <button
                    key={s.id || i}
                    onClick={() => handleReSearch({ id: s.place_id, name: s.place_name || s.search_query })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {s.place_name || s.search_query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Location Detail */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-700" />
            </div>
          ) : selectedPlace ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-primary-700 p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-5 h-5" />
                  <h2 className="text-lg font-bold">{selectedPlace.name}</h2>
                </div>
                <p className="text-primary-200 text-sm">{selectedPlace.block} {selectedPlace.floor ? `- ${selectedPlace.floor}` : ''}</p>
              </div>
              <div className="p-4 space-y-3 text-sm">
                {selectedPlace.description && (
                  <p className="text-gray-600">{selectedPlace.description}</p>
                )}
                {selectedPlace.landmark_hint && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                    <p className="text-gray-700"><span className="font-medium">Landmark:</span> {selectedPlace.landmark_hint}</p>
                  </div>
                )}
                {selectedPlace.directions_from_gate && (
                  <div className="mt-3">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-primary-600" />
                      Directions from Main Gate
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      {selectedPlace.directions_from_gate.split('\n').map((step, i) => (
                        <p key={i} className="text-gray-700 text-xs leading-relaxed">{step}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-gray-400">
              <MapPin className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">Search for a place to see details</p>
            </div>
          )}
        </div>

        {/* Right: SVG Campus Map */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Campus Map</h3>
            <svg viewBox="0 0 100 100" className="w-full h-auto" style={{ maxHeight: '500px' }}>
              {/* Background */}
              <rect x="0" y="0" width="100" height="100" fill="#f3f4f6" rx="1" />

              {/* Grid lines */}
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(n => (
                <g key={n}>
                  <line x1={n} y1="0" x2={n} y2="100" stroke="#e5e7eb" strokeWidth="0.2" />
                  <line x1="0" y1={n} x2="100" y2={n} stroke="#e5e7eb" strokeWidth="0.2" />
                </g>
              ))}

              {/* Blocks */}
              {campusBlocks.map((block) => {
                const isDestination = selectedPlace && selectedPlace.name === block.name
                return (
                  <g key={block.name}>
                    <rect
                      x={block.x}
                      y={block.y}
                      width={block.w}
                      height={block.h}
                      fill={isDestination ? '#ef4444' : block.color}
                      stroke={isDestination ? '#991b1b' : '#9ca3af'}
                      strokeWidth={isDestination ? 0.6 : 0.3}
                      rx="0.5"
                      className={isDestination ? 'animate-pulse' : ''}
                    />
                    <text
                      x={block.x + block.w / 2}
                      y={block.y + block.h / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isDestination ? 'white' : '#374151'}
                      fontSize="1.8"
                      fontWeight="600"
                    >
                      {block.name}
                    </text>
                  </g>
                )
              })}

              {/* Path from Main Gate to destination */}
              {selectedPlace && (
                <g>
                  <line
                    x1="45" y1="95"
                    x2={selectedPlace.map_x || 45}
                    y2={selectedPlace.map_y || 50}
                    stroke="#ef4444"
                    strokeWidth="0.6"
                    strokeDasharray="2,1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="45" cy="95" r="1.5" fill="#ef4444" />
                  <circle cx={selectedPlace.map_x || 45} cy={selectedPlace.map_y || 50} r="2" fill="#ef4444" className="animate-ping" style={{ opacity: 0.5 }} />
                  <circle cx={selectedPlace.map_x || 45} cy={selectedPlace.map_y || 50} r="1.5" fill="#dc2626" />
                </g>
              )}

              {/* Main Gate label */}
              <text x="45" y="99" textAnchor="middle" fill="#6b7280" fontSize="1.2" fontWeight="500">Main Gate</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
