const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

async function getBySubject(req, res) {
  try {
    const { subjectId } = req.params;
    const { date } = req.query;

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    if (req.user.role === 'faculty' && String(subject.faculty_id) !== req.user.id) {
      return res.status(403).json({ error: 'Not your subject' });
    }

    const enrollments = await Enrollment.find({ subject_id: subjectId }).populate('student_id', 'id name email');
    const students = enrollments.map(e => e.student_id).filter(Boolean);

    let records = [];
    if (date) {
      records = await Attendance.find({ subject_id: subjectId, date });
    } else {
      records = await Attendance.find({ subject_id: subjectId }).sort({ date: -1 });
    }

    res.json({ subject, students, records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function save(req, res) {
  try {
    const { subject_id, date, records } = req.body;
    if (!subject_id || !date || !records) {
      return res.status(400).json({ error: 'subject_id, date, and records are required' });
    }

    const subject = await Subject.findById(subject_id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    if (req.user.role === 'faculty' && String(subject.faculty_id) !== req.user.id) {
      return res.status(403).json({ error: 'Not your subject' });
    }

    const ops = records.map(r => ({
      updateOne: {
        filter: { student_id: r.student_id, subject_id, date },
        update: { $set: { status: r.status } },
        upsert: true,
      }
    }));

    await Attendance.bulkWrite(ops);

    const saved = await Attendance.find({ subject_id, date });
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getByStudent(req, res) {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'faculty') {
      const teaches = await Enrollment.findOne({ student_id: studentId })
        .populate({ path: 'subject_id', match: { faculty_id: req.user.id } });
      if (!teaches || !teaches.subject_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const records = await Attendance.find({ student_id: studentId })
      .populate('subject_id', 'name code')
      .sort({ subject_id: 1, date: 1 });

    const mapped = records.map(r => ({
      id: r.id, _id: r._id, student_id: r.student_id,
      subject_id: r.subject_id?._id || r.subject_id,
      subject_name: r.subject_id?.name || null,
      subject_code: r.subject_id?.code || null,
      date: r.date, status: r.status,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getBySubject, save, getByStudent };
