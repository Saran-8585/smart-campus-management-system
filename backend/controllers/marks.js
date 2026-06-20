const Marks = require('../models/Marks');
const Subject = require('../models/Subject');
const Enrollment = require('../models/Enrollment');

async function getBySubject(req, res) {
  try {
    const { subjectId } = req.params;
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    if (req.user.role === 'faculty' && String(subject.faculty_id) !== req.user.id) {
      return res.status(403).json({ error: 'Not your subject' });
    }

    const enrollments = await Enrollment.find({ subject_id: subjectId }).populate('student_id', 'id name email');
    const students = enrollments.map(e => e.student_id).filter(Boolean);

    const examType = req.query.exam_type || 'Mid';
    const records = await Marks.find({ subject_id: subjectId, exam_type: examType })
      .populate('student_id', 'name');

    const mapped = records.map(r => ({
      id: r.id, student_id: r.student_id?._id || r.student_id,
      student_name: r.student_id?.name || null,
      subject_id: r.subject_id, exam_type: r.exam_type,
      marks_obtained: r.marks_obtained, max_marks: r.max_marks,
      semester: r.semester,
    }));

    res.json({ subject, students, records: mapped, exam_type: examType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function save(req, res) {
  try {
    const { subject_id, exam_type, records } = req.body;
    if (!subject_id || !exam_type || !records) {
      return res.status(400).json({ error: 'subject_id, exam_type, and records are required' });
    }

    const subject = await Subject.findById(subject_id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    if (req.user.role === 'faculty' && String(subject.faculty_id) !== req.user.id) {
      return res.status(403).json({ error: 'Not your subject' });
    }

    const ops = records.map(r => ({
      updateOne: {
        filter: { student_id: r.student_id, subject_id, exam_type },
        update: { $set: { marks_obtained: r.marks_obtained, max_marks: r.max_marks, semester: subject.semester } },
        upsert: true,
      }
    }));

    await Marks.bulkWrite(ops);

    const saved = await Marks.find({ subject_id, exam_type }).populate('student_id', 'name');
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

    const records = await Marks.find({ student_id: studentId })
      .populate('subject_id', 'name code')
      .sort({ subject_id: 1, exam_type: 1 });

    const mapped = records.map(r => ({
      id: r.id, student_id: r.student_id,
      subject_id: r.subject_id?._id || r.subject_id,
      subject_name: r.subject_id?.name || null,
      subject_code: r.subject_id?.code || null,
      exam_type: r.exam_type, marks_obtained: r.marks_obtained,
      max_marks: r.max_marks, semester: r.semester,
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAll(req, res) {
  try {
    const { subject_id, exam_type, semester } = req.query;
    const filter = {};
    if (subject_id) filter.subject_id = subject_id;
    if (exam_type) filter.exam_type = exam_type;
    if (semester) filter.semester = Number(semester);

    const records = await Marks.find(filter)
      .populate('student_id', 'name')
      .populate('subject_id', 'name code')
      .sort({ subject_id: 1, exam_type: 1 });

    const mapped = records.map(r => ({
      id: r.id, student_id: r.student_id?._id || r.student_id,
      student_name: r.student_id?.name || null,
      subject_id: r.subject_id?._id || r.subject_id,
      subject_name: r.subject_id?.name || null,
      subject_code: r.subject_id?.code || null,
      exam_type: r.exam_type, marks_obtained: r.marks_obtained,
      max_marks: r.max_marks, semester: r.semester,
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getBySubject, save, getByStudent, getAll };
