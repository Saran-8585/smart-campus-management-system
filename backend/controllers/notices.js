const { getDB } = require('../db/database');

function getAll(req, res) {
  const db = getDB();
  const user = req.user;
  let notices;

  if (user.role === 'admin') {
    notices = db.prepare(`
      SELECT n.*, u.name AS poster_name
      FROM notices n
      JOIN users u ON u.id = n.posted_by
      ORDER BY n.created_at DESC
    `).all();
  } else if (user.role === 'faculty') {
    notices = db.prepare(`
      SELECT n.*, u.name AS poster_name
      FROM notices n
      JOIN users u ON u.id = n.posted_by
      WHERE n.target_role IN ('all', 'faculty')
      ORDER BY n.created_at DESC
    `).all();
  } else {
    notices = db.prepare(`
      SELECT n.*, u.name AS poster_name
      FROM notices n
      JOIN users u ON u.id = n.posted_by
      WHERE n.target_role IN ('all', 'student')
      ORDER BY n.created_at DESC
    `).all();
  }
  res.json(notices);
}

function create(req, res) {
  const db = getDB();
  const { title, body, category, target_role } = req.body;
  if (!title || !body || !category) {
    return res.status(400).json({ error: 'Title, body, and category are required' });
  }
  const validCategories = ['Exam', 'Event', 'Holiday', 'General'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  const info = db.prepare(
    'INSERT INTO notices (title, body, category, posted_by, target_role) VALUES (?, ?, ?, ?, ?)'
  ).run(title, body, category, req.user.id, target_role || 'all');
  const notice = db.prepare(`
    SELECT n.*, u.name AS poster_name
    FROM notices n JOIN users u ON u.id = n.posted_by WHERE n.id = ?
  `).get(info.lastInsertRowid);
  res.status(201).json(notice);
}

function remove(req, res) {
  const db = getDB();
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM notices WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Notice not found' });
  db.prepare('DELETE FROM notices WHERE id = ?').run(id);
  res.json({ message: 'Notice deleted' });
}

module.exports = { getAll, create, remove };
