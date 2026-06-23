const Room = require('../models/Room');
const RoomBooking = require('../models/RoomBooking');
const RoomIssue = require('../models/RoomIssue');
const Timetable = require('../models/Timetable');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// --- Room CRUD ---

async function list(req, res) {
  try {
    const { block, floor, room_type, status: rStatus } = req.query;
    const filter = {};
    if (block) filter.block = block;
    if (floor) filter.floor = floor;
    if (room_type) filter.room_type = room_type;
    if (rStatus) filter.status = rStatus;
    const rooms = await Room.find(filter).sort({ name: 1 });
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getById(req, res) {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function create(req, res) {
  try {
    const room = await Room.create(req.body);
    res.status(201).json(room);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Room already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function update(req, res) {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function remove(req, res) {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// --- Room Dashboard (all rooms with current status) ---

async function dashboard(req, res) {
  try {
    const now = new Date();
    const dayName = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'long' }).format(now);
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' });
    const parts = formatter.formatToParts(now);
    const currentMinutes = parseInt(parts.find(p => p.type === 'hour').value, 10) * 60 + parseInt(parts.find(p => p.type === 'minute').value, 10);

    const rooms = await Room.find({ status: 'Active' }).sort({ name: 1 });

    const todayClasses = await Timetable.find({
      day: dayName, is_active: 1,
    }).populate('subject_id', 'name code').lean();

    const roomsWithStatus = rooms.map(room => {
      const roomClasses = todayClasses.filter(t => t.room === room.name);
      const current = roomClasses.find(t => {
        const s = timeToMinutes(t.start_time);
        const e = timeToMinutes(t.end_time);
        return currentMinutes >= s && currentMinutes < e;
      }) || null;
      const upcoming = roomClasses.filter(t => timeToMinutes(t.start_time) > currentMinutes);
      return {
        ...room.toJSON(),
        current_class: current ? {
          subject_name: current.subject_id?.name,
          subject_code: current.subject_id?.code,
          start_time: current.start_time,
          end_time: current.end_time,
          faculty_name: current.faculty_name,
          section: current.section,
        } : null,
        upcoming_count: upcoming.length,
        today_total: roomClasses.length,
      };
    });

    res.json({
      rooms: roomsWithStatus,
      day: dayName,
      current_time: `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// --- Full Day Timeline ---

async function timeline(req, res) {
  try {
    const { room } = req.query;
    if (!room) return res.status(400).json({ error: 'Room number is required' });

    const now = new Date();
    const dayName = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'long' }).format(now);
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' });
    const parts = formatter.formatToParts(now);
    const currentMinutes = parseInt(parts.find(p => p.type === 'hour').value, 10) * 60 + parseInt(parts.find(p => p.type === 'minute').value, 10);

    const allToday = await Timetable.find({
      room: room.toUpperCase(), day: dayName, is_active: 1,
    }).populate('subject_id', 'name code').sort({ start_time: 1 });

    const past = allToday.filter(t => timeToMinutes(t.end_time) <= currentMinutes);
    const current = allToday.find(t => {
      const s = timeToMinutes(t.start_time);
      const e = timeToMinutes(t.end_time);
      return currentMinutes >= s && currentMinutes < e;
    }) || null;
    const upcoming = allToday.filter(t => timeToMinutes(t.start_time) > currentMinutes);

    const mapEntry = (t) => t ? {
      id: t._id, subject_name: t.subject_id?.name, subject_code: t.subject_id?.code,
      start_time: t.start_time, end_time: t.end_time, faculty_name: t.faculty_name,
      department: t.department, section: t.section, room: t.room,
    } : null;

    res.json({
      room: room.toUpperCase(),
      day: dayName,
      current_time: `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`,
      past: past.map(mapEntry),
      current: mapEntry(current),
      upcoming: upcoming.map(mapEntry),
      total: allToday.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// --- Utilization Analytics ---

async function utilization(req, res) {
  try {
    const { days: daysParam } = req.query;
    const numDays = parseInt(daysParam) || 5;

    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const slots = await Timetable.aggregate([
      { $match: { is_active: 1 } },
      { $group: {
        _id: { room: '$room', day: '$day' },
        total_slots: { $sum: 1 },
        total_minutes: { $sum: {
          $add: [
            { $multiply: [{ $subtract: [{ $toInt: { $substr: ['$end_time', 0, 2] } }, { $toInt: { $substr: ['$start_time', 0, 2] } }] }, 60] },
            { $subtract: [{ $toInt: { $substr: ['$end_time', 3, 2] } }, { $toInt: { $substr: ['$start_time', 3, 2] } }] },
          ],
        } },
      }},
      { $sort: { '_id.room': 1 } },
    ]);

    const rooms = await Room.find({}).sort({ name: 1 });
    const totalMinutesInWeek = numDays * 8 * 60;
    const roomData = rooms.map(room => {
      const roomSlots = slots.filter(s => s._id.room === room.name);
      const usedMinutes = roomSlots.reduce((sum, s) => sum + s.total_minutes, 0);
      const utilPercent = totalMinutesInWeek > 0 ? Math.min(100, Math.round((usedMinutes / totalMinutesInWeek) * 100)) : 0;
      return {
        name: room.name,
        block: room.block,
        capacity: room.capacity,
        total_weekly_slots: roomSlots.reduce((sum, s) => sum + s.total_slots, 0),
        used_minutes: usedMinutes,
        utilization_percent: utilPercent,
        by_day: weekdays.map(day => {
          const d = roomSlots.find(s => s._id.day === day);
          return { day, slots: d?.total_slots || 0, minutes: d?.total_minutes || 0 };
        }),
      };
    });

    res.json({
      rooms: roomData,
      total_capacity: rooms.reduce((s, r) => s + r.capacity, 0),
      weekdays,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// --- CSV Export ---

async function exportCSV(req, res) {
  try {
    const { room } = req.query;
    const filter = { is_active: 1 };
    if (room) filter.room = room.toUpperCase();

    const entries = await Timetable.find(filter)
      .populate('subject_id', 'name code')
      .sort({ room: 1, day: 1, start_time: 1 });

    const rows = [['Room', 'Day', 'Start Time', 'End Time', 'Subject', 'Subject Code', 'Faculty', 'Department', 'Section', 'Semester']];
    for (const e of entries) {
      rows.push([e.room, e.day, e.start_time, e.end_time, e.subject_id?.name || '', e.subject_id?.code || '', e.faculty_name || '', e.department || '', e.section || '', String(e.semester)]);
    }

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="classroom_schedule${room ? '_' + room : ''}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// --- Room Bookings ---

async function createBooking(req, res) {
  try {
    const { room_id, title, purpose, date, start_time, end_time } = req.body;
    if (!room_id || !title || !date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const overlap = await RoomBooking.findOne({
      room_id,
      date,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { start_time: { $lt: end_time }, end_time: { $gt: start_time } },
      ],
    });

    if (overlap) return res.status(409).json({ error: 'Time slot overlaps with existing booking' });

    const booking = await RoomBooking.create({
      room_id, title, purpose, date, start_time, end_time,
      booked_by: req.user.id,
    });

    const populated = await RoomBooking.findById(booking._id)
      .populate('booked_by', 'name email')
      .populate('room_id', 'name block floor');

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function listMyBookings(req, res) {
  try {
    const bookings = await RoomBooking.find({ booked_by: req.user.id })
      .populate('room_id', 'name block floor')
      .sort({ date: -1, start_time: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function listAllBookings(req, res) {
  try {
    const { status: bStatus, room_id, date } = req.query;
    const filter = {};
    if (bStatus) filter.status = bStatus;
    if (room_id) filter.room_id = room_id;
    if (date) filter.date = date;

    const bookings = await RoomBooking.find(filter)
      .populate('room_id', 'name block floor')
      .populate('booked_by', 'name email')
      .sort({ date: -1, start_time: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function reviewBooking(req, res) {
  try {
    const { status, remarks } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Approved or Rejected' });
    }
    const booking = await RoomBooking.findByIdAndUpdate(req.params.id, {
      status, remarks, reviewed_by: req.user.id, reviewed_at: new Date(),
    }, { new: true })
      .populate('room_id', 'name block floor')
      .populate('booked_by', 'name email');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function cancelBooking(req, res) {
  try {
    const booking = await RoomBooking.findOneAndUpdate(
      { _id: req.params.id, booked_by: req.user.id },
      { status: 'Cancelled' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found or not yours' });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// --- Room Issues ---

async function createIssue(req, res) {
  try {
    const { room_id, category, description, priority } = req.body;
    if (!room_id || !category || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const issue = await RoomIssue.create({
      room_id, category, description, priority, reported_by: req.user.id,
    });
    const populated = await RoomIssue.findById(issue._id)
      .populate('reported_by', 'name email')
      .populate('room_id', 'name block floor');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function listIssues(req, res) {
  try {
    const { status: iStatus, room_id, priority: iPriority } = req.query;
    const filter = {};
    if (iStatus) filter.status = iStatus;
    if (room_id) filter.room_id = room_id;
    if (iPriority) filter.priority = iPriority;

    const issues = await RoomIssue.find(filter)
      .populate('reported_by', 'name email')
      .populate('resolved_by', 'name')
      .populate('room_id', 'name block floor')
      .sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateIssueStatus(req, res) {
  try {
    const { status, resolution_notes } = req.body;
    if (!['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const update = { status };
    if (status === 'Resolved' || status === 'Closed') {
      update.resolved_by = req.user.id;
      update.resolved_at = new Date();
    }
    if (resolution_notes) update.resolution_notes = resolution_notes;

    const issue = await RoomIssue.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('reported_by', 'name email')
      .populate('resolved_by', 'name')
      .populate('room_id', 'name block floor');
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  list, getById, create, update, remove,
  dashboard, timeline, utilization, exportCSV,
  createBooking, listMyBookings, listAllBookings, reviewBooking, cancelBooking,
  createIssue, listIssues, updateIssueStatus,
};
