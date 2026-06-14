const Subject = require('../models/Subject');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

async function getAll(req, res) {
  try {
    let subjects;
    if (req.user.role === 'faculty') {
      subjects = await Subject.find({ faculty_id: req.user.id }).populate('faculty_id', 'name').sort({ name: 1 });
    } else if (req.user.role === 'student') {
      const enrollments = await Enrollment.find({ student_id: req.user.id }).distinct('subject_id');
      subjects = await Subject.find({ _id: { $in: enrollments } }).populate('faculty_id', 'name').sort({ name: 1 });
    } else {
      subjects = await Subject.find({}).populate('faculty_id', 'name').sort({ name: 1 });
    }
    const mapped = subjects.map(s => ({
      id: s.id, _id: s._id, name: s.name, code: s.code, department: s.department,
      semester: s.semester, credits: s.credits, faculty_id: s.faculty_id?._id || s.faculty_id,
      faculty_name: s.faculty_id?.name || null, active: s.active,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function create(req, res) {
  try {
    const { name, code, department, semester, credits, faculty_id } = req.body;
    if (!name || !code || !department || !semester) {
      return res.status(400).json({ error: 'Name, code, department, and semester are required' });
    }
    const existing = await Subject.findOne({ code });
    if (existing) return res.status(400).json({ error: 'Subject code already exists' });

    const subject = await Subject.create({
      name, code, department, semester,
      credits: credits || 3,
      faculty_id: faculty_id || null,
    });

    const populated = await Subject.findById(subject._id).populate('faculty_id', 'name');
    res.status(201).json({
      id: populated.id, _id: populated._id, name: populated.name, code: populated.code,
      department: populated.department, semester: populated.semester, credits: populated.credits,
      faculty_id: populated.faculty_id?._id || populated.faculty_id,
      faculty_name: populated.faculty_id?.name || null, active: populated.active,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Subject code already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getStudents(req, res) {
  try {
    const { id } = req.params;
    const enrollments = await Enrollment.find({ subject_id: id }).populate('student_id', 'id name email department phone');
    const students = enrollments.map(e => e.student_id).filter(Boolean);
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const existing = await Subject.findById(id);
    if (!existing) return res.status(404).json({ error: 'Subject not found' });

    const { name, code, department, semester, credits, faculty_id } = req.body;
    if (!name || !code || !department || !semester) {
      return res.status(400).json({ error: 'Name, code, department, and semester are required' });
    }

    const dup = await Subject.findOne({ code, _id: { $ne: id } });
    if (dup) return res.status(400).json({ error: 'Subject code already exists' });

    await Subject.findByIdAndUpdate(id, { name, code, department, semester, credits: credits || 3, faculty_id: faculty_id || null });
    const updated = await Subject.findById(id).populate('faculty_id', 'name');
    res.json({
      id: updated.id, _id: updated._id, name: updated.name, code: updated.code,
      department: updated.department, semester: updated.semester, credits: updated.credits,
      faculty_id: updated.faculty_id?._id || updated.faculty_id,
      faculty_name: updated.faculty_id?.name || null, active: updated.active,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Subject code already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function remove(req, res) {
  try {
    const existing = await Subject.findOne({ _id: req.params.id, active: 1 });
    if (!existing) return res.status(404).json({ error: 'Subject not found' });
    await Subject.findByIdAndUpdate(req.params.id, { active: 0 });
    res.json({ message: 'Subject deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getAll, create, getStudents, update, remove };
