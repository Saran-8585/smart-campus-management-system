const { getDB } = require('../db/database');

function status(req, res) {
  const { room } = req.query;
  if (!room) {
    return res.status(400).json({ error: 'Room number is required' });
  }

  const db = getDB();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const currentDay = days[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (currentDay === 'Sunday' || currentDay === 'Saturday') {
    return res.json({ current: null, upcoming_today: [] });
  }

  const current = db.prepare(`
    SELECT t.*, s.name AS subject_name, s.code AS subject_code
    FROM timetable t
    JOIN subjects s ON s.id = t.subject_id
    WHERE t.room = ? AND t.day = ? AND t.start_time <= ? AND t.end_time >= ? AND t.is_active = 1
    LIMIT 1
  `).get(room, currentDay, currentTime, currentTime);

  const upcoming = db.prepare(`
    SELECT t.*, s.name AS subject_name, s.code AS subject_code
    FROM timetable t
    JOIN subjects s ON s.id = t.subject_id
    WHERE t.room = ? AND t.day = ? AND t.start_time > ? AND t.is_active = 1
    ORDER BY t.start_time ASC
  `).all(room, currentDay, currentTime);

  res.json({ current: current || null, upcoming_today: upcoming });
}

module.exports = { status };
