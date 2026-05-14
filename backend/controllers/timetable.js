const { getDB } = require('../db/database');

function getTimetable(req, res) {
  const db = getDB();
  const user = req.user;
  let rows;

  if (user.role === 'admin') {
    rows = db.prepare(`
      SELECT t.*, s.name AS subject_name, s.code AS subject_code, s.semester,
             u.name AS faculty_name
      FROM timetable t
      JOIN subjects s ON s.id = t.subject_id
      LEFT JOIN users u ON s.faculty_id = u.id
      ORDER BY t.day, t.start_time
    `).all();
  } else if (user.role === 'faculty') {
    rows = db.prepare(`
      SELECT t.*, s.name AS subject_name, s.code AS subject_code, s.semester
      FROM timetable t
      JOIN subjects s ON s.id = t.subject_id
      WHERE s.faculty_id = ?
      ORDER BY t.day, t.start_time
    `).all(user.id);
  } else {
    rows = db.prepare(`
      SELECT t.*, s.name AS subject_name, s.code AS subject_code, s.semester,
             u.name AS faculty_name
      FROM timetable t
      JOIN subjects s ON s.id = t.subject_id
      JOIN enrollments e ON e.subject_id = s.id
      LEFT JOIN users u ON s.faculty_id = u.id
      WHERE e.student_id = ?
      ORDER BY t.day, t.start_time
    `).all(user.id);
  }

  res.json(rows);
}

function create(req, res) {
  const db = getDB();
  const { subject_id, day, start_time, end_time, room, semester } = req.body;
  if (!subject_id || !day || !start_time || !end_time || !room || !semester) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const info = db.prepare(
    'INSERT INTO timetable (subject_id, day, start_time, end_time, room, semester) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(subject_id, day, start_time, end_time, room, semester);
  const entry = db.prepare(`
    SELECT t.*, s.name AS subject_name, s.code AS subject_code
    FROM timetable t JOIN subjects s ON s.id = t.subject_id WHERE t.id = ?
  `).get(info.lastInsertRowid);
  res.status(201).json(entry);
}

function remove(req, res) {
  const db = getDB();
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM timetable WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });
  db.prepare('DELETE FROM timetable WHERE id = ?').run(id);
  res.json({ message: 'Entry deleted' });
}

module.exports = { getTimetable, create, remove };
