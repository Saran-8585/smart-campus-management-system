const { getDB } = require('../db/database');

function getAll(req, res) {
  const db = getDB();
  let subjects;
  if (req.user.role === 'faculty') {
    subjects = db.prepare(`
      SELECT s.*, u.name AS faculty_name
      FROM subjects s LEFT JOIN users u ON s.faculty_id = u.id
      WHERE s.faculty_id = ?
      ORDER BY s.name
    `).all(req.user.id);
  } else if (req.user.role === 'student') {
    subjects = db.prepare(`
      SELECT s.*, u.name AS faculty_name
      FROM subjects s
      JOIN enrollments e ON e.subject_id = s.id
      LEFT JOIN users u ON s.faculty_id = u.id
      WHERE e.student_id = ?
      ORDER BY s.name
    `).all(req.user.id);
  } else {
    subjects = db.prepare(`
      SELECT s.*, u.name AS faculty_name
      FROM subjects s LEFT JOIN users u ON s.faculty_id = u.id
      ORDER BY s.name
    `).all();
  }
  res.json(subjects);
}

function create(req, res) {
  const db = getDB();
  const { name, code, department, semester, credits, faculty_id } = req.body;
  if (!name || !code || !department || !semester) {
    return res.status(400).json({ error: 'Name, code, department, and semester are required' });
  }
  const existing = db.prepare('SELECT id FROM subjects WHERE code = ?').get(code);
  if (existing) return res.status(400).json({ error: 'Subject code already exists' });
  const info = db.prepare(
    'INSERT INTO subjects (name, code, department, semester, credits, faculty_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, code, department, semester, credits || 3, faculty_id || null);
  const subject = db.prepare(`
    SELECT s.*, u.name AS faculty_name
    FROM subjects s LEFT JOIN users u ON s.faculty_id = u.id
    WHERE s.id = ?
  `).get(info.lastInsertRowid);
  res.status(201).json(subject);
}

function getStudents(req, res) {
  const db = getDB();
  const { id } = req.params;
  const students = db.prepare(`
    SELECT u.id, u.name, u.email, u.department, u.phone
    FROM users u
    JOIN enrollments e ON e.student_id = u.id
    WHERE e.subject_id = ?
    ORDER BY u.name
  `).all(id);
  res.json(students);
}

module.exports = { getAll, create, getStudents };
