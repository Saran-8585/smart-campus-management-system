const { getDB } = require('../db/database');

function getTimetable(req, res) {
  const db = getDB();
  const user = req.user;
  const includeInactive = req.query.include_inactive === 'true';
  let activeFilter = includeInactive ? '' : ' AND t.is_active = 1';
  let rows;

  if (user.role === 'admin') {
    rows = db.prepare(`
      SELECT t.*, s.name AS subject_name, s.code AS subject_code, s.semester,
             u.name AS faculty_name
      FROM timetable t
      JOIN subjects s ON s.id = t.subject_id
      LEFT JOIN users u ON s.faculty_id = u.id
      WHERE 1=1${activeFilter}
      ORDER BY t.day, t.start_time
    `).all();
  } else if (user.role === 'faculty') {
    rows = db.prepare(`
      SELECT t.*, s.name AS subject_name, s.code AS subject_code, s.semester
      FROM timetable t
      JOIN subjects s ON s.id = t.subject_id
      WHERE s.faculty_id = ?${activeFilter}
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
      WHERE e.student_id = ?${activeFilter}
      ORDER BY t.day, t.start_time
    `).all(user.id);
  }

  res.json(rows);
}

function create(req, res) {
  const db = getDB();
  const { subject_id, day, start_time, end_time, room, semester, faculty_name, department, section } = req.body;
  if (!subject_id || !day || !start_time || !end_time || !room || !semester) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const info = db.prepare(
    'INSERT INTO timetable (subject_id, day, start_time, end_time, room, semester, faculty_name, department, section, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(subject_id, day, start_time, end_time, room, semester, faculty_name || null, department || null, section || null, req.user.id);
  const entry = db.prepare(`
    SELECT t.*, s.name AS subject_name, s.code AS subject_code
    FROM timetable t JOIN subjects s ON s.id = t.subject_id WHERE t.id = ?
  `).get(info.lastInsertRowid);
  res.status(201).json(entry);
}

function update(req, res) {
  const db = getDB();
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM timetable WHERE id = ? AND is_active = 1').get(id);
  if (!existing) return res.status(404).json({ error: 'Active timetable entry not found' });

  const { subject_id, day, start_time, end_time, room, semester, faculty_name, department, section } = req.body;
  if (!subject_id || !day || !start_time || !end_time || !room || !semester) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.prepare("UPDATE timetable SET is_active = 0, deactivated_at = datetime('now') WHERE id = ?").run(id);

  const info = db.prepare(
    'INSERT INTO timetable (subject_id, day, start_time, end_time, room, semester, faculty_name, department, section, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(subject_id, day, start_time, end_time, room, semester, faculty_name || null, department || null, section || null, req.user.id);

  const entry = db.prepare(`
    SELECT t.*, s.name AS subject_name, s.code AS subject_code
    FROM timetable t JOIN subjects s ON s.id = t.subject_id WHERE t.id = ?
  `).get(info.lastInsertRowid);
  res.json(entry);
}

function remove(req, res) {
  const db = getDB();
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM timetable WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });
  db.prepare("UPDATE timetable SET is_active = 0, deactivated_at = datetime('now'), updated_by = ? WHERE id = ?").run(req.user.id, id);
  res.json({ message: 'Entry deactivated' });
}

function getHistory(req, res) {
  const db = getDB();
  const { room } = req.query;
  if (!room) return res.status(400).json({ error: 'Room parameter is required' });
  const rows = db.prepare(`
    SELECT t.*, s.name AS subject_name, s.code AS subject_code, u.name AS updated_by_name
    FROM timetable t
    JOIN subjects s ON s.id = t.subject_id
    LEFT JOIN users u ON u.id = t.updated_by
    WHERE t.room = ?
    ORDER BY t.id DESC
  `).all(room);
  res.json(rows);
}

module.exports = { getTimetable, create, update, remove, getHistory };
