import { useState, useEffect } from 'react'
import { Loader2, Calendar } from 'lucide-react'
import api from '../../utils/axios'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function StudentTimetable() {
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/timetable')
      .then((res) => setTimetable(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const groupedByDay = days.map((day) => ({
    day,
    entries: timetable.filter((t) => t.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }))

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary-700" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Timetable</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {timetable.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar className="w-16 h-16 mx-auto mb-3" />
            <p>No timetable entries</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-px bg-gray-200">
            {groupedByDay.map(({ day, entries }) => (
              <div key={day} className="bg-white">
                <div className={`text-center py-3 text-sm font-semibold ${
                  day === days[new Date().getDay() === 0 ? 5 : new Date().getDay() - 1]
                    ? 'bg-primary-700 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}>{day}</div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {entries.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No classes</p>
                  ) : (
                    entries.map((e) => (
                      <div key={e.id} className="bg-primary-50 rounded-lg p-3 border border-primary-100">
                        <p className="font-medium text-primary-800 text-sm">{e.subject_name}</p>
                        <p className="text-xs text-primary-600">{e.start_time} - {e.end_time}</p>
                        <p className="text-xs text-primary-500">Room {e.room}</p>
                        <p className="text-xs text-primary-400 mt-1">{e.faculty_name}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
