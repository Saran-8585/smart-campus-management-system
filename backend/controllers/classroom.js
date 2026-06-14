const { getDB } = require('../db/database');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

function getCurrentTimeInTimezone() {
  const now = new Date();
  const dayName = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'long' }).format(now);
  const timeStr = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  return { dayName, timeStr };
}

function status(req, res) {
  const { room } = req.query;
  if (!room) {
    return res.status(400).json({ error: 'Room number is required' });
  }

  const db = getDB();
  const { dayName: currentDay, timeStr: currentTime } = getCurrentTimeInTimezone();

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
