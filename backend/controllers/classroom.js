const Timetable = require('../models/Timetable');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

function getCurrentTimeInTimezone() {
  const now = new Date();
  const dayName = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'long' }).format(now);
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' });
  const parts = formatter.formatToParts(now);
  const h = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const m = parseInt(parts.find(p => p.type === 'minute').value, 10);
  const currentMinutes = h * 60 + m;
  return { dayName, currentMinutes };
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

async function status(req, res) {
  try {
    const { room } = req.query;
    if (!room) {
      return res.status(400).json({ error: 'Room number is required' });
    }

    const { dayName: currentDay, currentMinutes } = getCurrentTimeInTimezone();

    if (currentDay === 'Sunday' || currentDay === 'Saturday') {
      return res.json({ current: null, upcoming_today: [] });
    }

    const allToday = await Timetable.find({
      room, day: currentDay,
      is_active: 1,
    }).populate('subject_id', 'name code').sort({ start_time: 1 });

    const current = allToday.find(t => {
      const start = timeToMinutes(t.start_time);
      const end = timeToMinutes(t.end_time);
      return currentMinutes >= start && currentMinutes < end;
    }) || null;

    const upcoming = allToday.filter(t => timeToMinutes(t.start_time) > currentMinutes);

    const mapEntry = (t) => t ? {
      id: t.id, _id: t._id, subject_id: t.subject_id?._id || t.subject_id,
      subject_name: t.subject_id?.name || null, subject_code: t.subject_id?.code || null,
      day: t.day, start_time: t.start_time, end_time: t.end_time, room: t.room,
      semester: t.semester, faculty_name: t.faculty_name, department: t.department,
      section: t.section, is_active: t.is_active,
    } : null;

    res.json({ current: mapEntry(current), upcoming_today: upcoming.map(mapEntry) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { status };
