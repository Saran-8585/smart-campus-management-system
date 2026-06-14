const Timetable = require('../models/Timetable');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

function getCurrentTimeInTimezone() {
  const now = new Date();
  const dayName = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'long' }).format(now);
  const timeStr = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  return { dayName, timeStr };
}

async function status(req, res) {
  try {
    const { room } = req.query;
    if (!room) {
      return res.status(400).json({ error: 'Room number is required' });
    }

    const { dayName: currentDay, timeStr: currentTime } = getCurrentTimeInTimezone();

    if (currentDay === 'Sunday' || currentDay === 'Saturday') {
      return res.json({ current: null, upcoming_today: [] });
    }

    const current = await Timetable.findOne({
      room, day: currentDay,
      start_time: { $lte: currentTime },
      end_time: { $gte: currentTime },
      is_active: 1,
    }).populate('subject_id', 'name code').limit(1);

    const upcoming = await Timetable.find({
      room, day: currentDay,
      start_time: { $gt: currentTime },
      is_active: 1,
    }).populate('subject_id', 'name code').sort({ start_time: 1 });

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
