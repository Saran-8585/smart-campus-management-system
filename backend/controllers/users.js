const bcrypt = require('bcryptjs');
const { getDB } = require('../db/database');

function getAll(req, res) {
  const db = getDB();
  const { role } = req.query;
  let query = 'SELECT id, name, email, role, department, phone, active, created_at FROM users';
  const params = [];
  if (role) {
    query += ' WHERE role = ?';
    params.push(role);
  }
  query += ' ORDER BY created_at DESC';
  const users = db.prepare(query).all(...params);
  res.json(users);
}

function create(req, res) {
  const db = getDB();
  const { name, email, password, role, department, phone } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  const hashed = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (name, email, password, role, department, phone) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, email, hashed, role, department || null, phone || null);
  const user = db.prepare('SELECT id, name, email, role, department, phone, active, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(user);
}

function update(req, res) {
  const db = getDB();
  const { id } = req.params;
  const { name, email, password, role, department, phone, active } = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  const updates = [];
  const params = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (password) { updates.push('password = ?'); params.push(bcrypt.hashSync(password, 10)); }
  if (role !== undefined) { updates.push('role = ?'); params.push(role); }
  if (department !== undefined) { updates.push('department = ?'); params.push(department); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const user = db.prepare('SELECT id, name, email, role, department, phone, active, created_at FROM users WHERE id = ?').get(id);
  res.json(user);
}

module.exports = { getAll, create, update };
