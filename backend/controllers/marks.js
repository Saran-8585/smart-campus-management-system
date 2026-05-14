const { getDB } = require('../db/database');

function getByStudent(req, res) {
  const db = getDB();
  const { studentId } = req.params;

  if (req.user.role === 'student' && req.user.id !== Number(studentId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const marks = db.prepare(`
    SELECT m.*, s.name AS subject_name, s.code AS subject_code
    FROM marks m
    JOIN subjects s ON s.id = m.subject_id
    WHERE m.student_id = ?
    ORDER BY s.name, m.exam_type
  `).all(studentId);

  res.json(marks);
}

function save(req, res) {
  const db = getDB();
  const { subject_id, exam_type, marks: marksData } = req.body;

  if (!subject_id || !exam_type || !marksData) {
    return res.status(400).json({ error: 'subject_id, exam_type, and marks are required' });
  }

  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subject_id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  if (req.user.role === 'faculty' && subject.faculty_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your subject' });
  }

  const upsert = db.prepare(`
    INSERT INTO marks (student_id, subject_id, exam_type, score, max_score)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(student_id, subject_id, exam_type)
    DO UPDATE SET score = excluded.score, max_score = excluded.max_score
  `);

  const transaction = db.transaction(() => {
    for (const m of marksData) {
      upsert.run(m.student_id, subject_id, exam_type, m.score, m.max_score || 100);
    }
  });
  transaction();

  const saved = db.prepare(`
    SELECT m.*, u.name AS student_name
    FROM marks m
    JOIN users u ON u.id = m.student_id
    WHERE m.subject_id = ? AND m.exam_type = ?
  `).all(subject_id, exam_type);

  res.json(saved);
}

module.exports = { getByStudent, save };
