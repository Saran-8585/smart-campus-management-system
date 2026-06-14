const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');
const Enrollment = require('../models/Enrollment');

async function getTimetable(req, res) {
  try {
    const user = req.user;
    const includeInactive = req.query.include_inactive === 'true';
    const activeFilter = includeInactive ? {} : { is_active: 1 };
    let rows;

    if (user.role === 'admin') {
      rows = await Timetable.find(activeFilter)
        .populate('subject_id', 'name code semester')
        .populate({ path: 'subject_id', populate: { path: 'faculty_id', select: 'name' } })
        .sort({ day: 1, start_time: 1 });
    } else if (user.role === 'faculty') {
      const subjects = await Subject.find({ faculty_id: user.id }).distinct('_id');
      rows = await Timetable.find({ ...activeFilter, subject_id: { $in: subjects } })
        .populate('subject_id', 'name code semester')
        .sort({ day: 1, start_time: 1 });
    } else {
      const enrollments = await Enrollment.find({ student_id: user.id }).distinct('subject_id');
      rows = await Timetable.find({ ...activeFilter, subject_id: { $in: enrollments } })
        .populate('subject_id', 'name code semester')
        .populate({ path: 'subject_id', populate: { path: 'faculty_id', select: 'name' } })
        .sort({ day: 1, start_time: 1 });
    }

    const mapped = rows.map(t => ({
      id: t.id, _id: t._id, subject_id: t.subject_id?._id || t.subject_id,
      subject_name: t.subject_id?.name || null, subject_code: t.subject_id?.code || null,
      semester: t.semester, day: t.day, start_time: t.start_time, end_time: t.end_time,
      room: t.room, faculty_name: t.subject_id?.faculty_id?.name || t.faculty_name || null,
      department: t.department, section: t.section, is_active: t.is_active,
      deactivated_at: t.deactivated_at, updated_by: t.updated_by,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function checkConflict(day, start_time, end_time, room, excludeId) {
  const filter = { day, room, is_active: 1, start_time: { $lt: end_time }, end_time: { $gt: start_time } };
  if (excludeId) filter._id = { $ne: excludeId };
  const conflict = await Timetable.findOne(filter).select('_id');
  return !!conflict;
}

async function create(req, res) {
  try {
    const { subject_id, day, start_time, end_time, room, semester, faculty_name, department, section } = req.body;
    if (!subject_id || !day || !start_time || !end_time || !room || !semester) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (await checkConflict(day, start_time, end_time, room)) {
      return res.status(409).json({ error: `Room ${room} already has a class scheduled during this time on ${day}` });
    }
    const entry = await Timetable.create({
      subject_id, day, start_time, end_time, room, semester,
      faculty_name: faculty_name || null, department: department || null,
      section: section || null, updated_by: req.user.id,
    });
    const populated = await Timetable.findById(entry._id).populate('subject_id', 'name code');
    res.status(201).json({
      id: populated.id, _id: populated._id, subject_id: populated.subject_id?._id || populated.subject_id,
      subject_name: populated.subject_id?.name || null, subject_code: populated.subject_id?.code || null,
      day: populated.day, start_time: populated.start_time, end_time: populated.end_time,
      room: populated.room, semester: populated.semester, faculty_name: populated.faculty_name,
      department: populated.department, section: populated.section, is_active: populated.is_active,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const existing = await Timetable.findOne({ _id: id, is_active: 1 });
    if (!existing) return res.status(404).json({ error: 'Active timetable entry not found' });

    const { subject_id, day, start_time, end_time, room, semester, faculty_name, department, section } = req.body;
    if (!subject_id || !day || !start_time || !end_time || !room || !semester) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (await checkConflict(day, start_time, end_time, room, id)) {
      return res.status(409).json({ error: `Room ${room} already has a class scheduled during this time on ${day}` });
    }

    await Timetable.findByIdAndUpdate(id, { is_active: 0, deactivated_at: new Date() });

    const entry = await Timetable.create({
      subject_id, day, start_time, end_time, room, semester,
      faculty_name: faculty_name || null, department: department || null,
      section: section || null, updated_by: req.user.id,
    });
    const populated = await Timetable.findById(entry._id).populate('subject_id', 'name code');
    res.json({
      id: populated.id, _id: populated._id, subject_id: populated.subject_id?._id || populated.subject_id,
      subject_name: populated.subject_id?.name || null, subject_code: populated.subject_id?.code || null,
      day: populated.day, start_time: populated.start_time, end_time: populated.end_time,
      room: populated.room, semester: populated.semester, faculty_name: populated.faculty_name,
      department: populated.department, section: populated.section, is_active: populated.is_active,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const existing = await Timetable.findById(id);
    if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });
    await Timetable.findByIdAndUpdate(id, { is_active: 0, deactivated_at: new Date(), updated_by: req.user.id });
    res.json({ message: 'Entry deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getHistory(req, res) {
  try {
    const { room } = req.query;
    if (!room) return res.status(400).json({ error: 'Room parameter is required' });
    const rows = await Timetable.find({ room })
      .populate('subject_id', 'name code')
      .populate('updated_by', 'name')
      .sort({ _id: -1 });
    const mapped = rows.map(t => ({
      id: t.id, _id: t._id, subject_id: t.subject_id?._id || t.subject_id,
      subject_name: t.subject_id?.name || null, subject_code: t.subject_id?.code || null,
      day: t.day, start_time: t.start_time, end_time: t.end_time, room: t.room,
      semester: t.semester, faculty_name: t.faculty_name, department: t.department,
      section: t.section, is_active: t.is_active, deactivated_at: t.deactivated_at,
      updated_by: t.updated_by?._id || t.updated_by,
      updated_by_name: t.updated_by?.name || null,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getTimetable, create, update, remove, getHistory };
