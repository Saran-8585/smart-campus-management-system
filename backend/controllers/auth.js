const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db/database');

const VALID_ROLES = ['student', 'faculty', 'admin'];

function login(req, res) {
  const { identifier, password, role } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password are required' });
  }

  const userRole = role || 'student';
  if (!VALID_ROLES.includes(userRole)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const db = getDB();
  let user;

  if (userRole === 'admin') {
    user = db.prepare('SELECT * FROM users WHERE email = ? AND role = ? AND active = 1').get(identifier, 'admin');
    if (!user) {
      return res.status(401).json({ field: 'identifier', message: 'Invalid credentials' });
    }
  } else if (userRole === 'student') {
    if (!/^[a-zA-Z0-9]{8,12}$/.test(identifier)) {
      return res.status(400).json({ field: 'identifier', message: 'Register Number must be alphanumeric and 8-12 characters' });
    }
    user = db.prepare('SELECT * FROM users WHERE register_number = ? AND role = ? AND active = 1').get(identifier, 'student');
    if (!user) {
      return res.status(401).json({ field: 'identifier', message: 'Invalid Register Number' });
    }
  } else if (userRole === 'faculty') {
    user = db.prepare('SELECT * FROM users WHERE staff_id = ? AND role = ? AND active = 1').get(identifier, 'faculty');
    if (!user) {
      return res.status(401).json({ field: 'identifier', message: 'Invalid Staff ID' });
    }
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ field: 'password', message: 'Invalid Password' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, phone: user.phone, register_number: user.register_number, staff_id: user.staff_id, active: user.active },
  });
}

function me(req, res) {
  const db = getDB();
  const user = db.prepare('SELECT id, name, email, role, department, phone, register_number, staff_id, active FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}

module.exports = { login, me };
