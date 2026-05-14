const { getDB } = require('../db/database');

function getBySubject(req, res) {
  const db = getDB();
  const { subjectId } = req.params;
  const { date } = req.query;

  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  if (req.user.role === 'faculty' && subject.faculty_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your subject' });
  }

  const students = db.prepare(`
    SELECT u.id, u.name, u.email
    FROM users u
    JOIN enrollments e ON e.student_id = u.id
    WHERE e.subject_id = ? AND u.role = 'student'
    ORDER BY u.name
  `).all(subjectId);

  let records = [];
  if (date) {
    records = db.prepare(`
      SELECT * FROM attendance WHERE subject_id = ? AND date = ?
    `).all(subjectId, date);
  } else {
    records = db.prepare(`
      SELECT * FROM attendance WHERE subject_id = ? ORDER BY date DESC
    `).all(subjectId);
  }

  res.json({ subject, students, records });
}

function save(req, res) {
  const db = getDB();
  const { subject_id, date, records } = req.body;
  if (!subject_id || !date || !records) {
    return res.status(400).json({ error: 'subject_id, date, and records are required' });
  }

  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subject_id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  if (req.user.role === 'faculty' && subject.faculty_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your subject' });
  }

  const upsert = db.prepare(`
    INSERT INTO attendance (student_id, subject_id, date, status)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(student_id, subject_id, date)
    DO UPDATE SET status = excluded.status
  `);

  const transaction = db.transaction(() => {
    for (const r of records) {
      upsert.run(r.student_id, subject_id, date, r.status);
    }
  });
  transaction();

  const saved = db.prepare('SELECT * FROM attendance WHERE subject_id = ? AND date = ?').all(subject_id, date);
  res.json(saved);
}

function getByStudent(req, res) {
  const db = getDB();
  const { studentId } = req.params;

  const records = db.prepare(`
    SELECT a.*, s.name AS subject_name, s.code AS subject_code
    FROM attendance a
    JOIN subjects s ON s.id = a.subject_id
    WHERE a.student_id = ?
    ORDER BY s.name, a.date
  `).all(studentId);

  res.json(records);
}

module.exports = { getBySubject, save, getByStudent };
