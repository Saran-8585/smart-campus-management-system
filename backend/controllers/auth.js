const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const VALID_ROLES = ['student', 'faculty', 'admin'];

async function login(req, res) {
  try {
    const { identifier, password, role } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    const userRole = role || 'student';
    if (!VALID_ROLES.includes(userRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    let user;
    if (userRole === 'admin') {
      user = await User.findOne({ email: identifier, role: 'admin', active: 1 });
      if (!user) {
        return res.status(401).json({ field: 'identifier', message: 'Invalid credentials' });
      }
    } else if (userRole === 'student') {
      if (!/^[a-zA-Z0-9]{8,12}$/.test(identifier)) {
        return res.status(400).json({ field: 'identifier', message: 'Register Number must be alphanumeric and 8-12 characters' });
      }
      user = await User.findOne({ register_number: identifier, role: 'student', active: 1 });
      if (!user) {
        return res.status(401).json({ field: 'identifier', message: 'Invalid Register Number' });
      }
    } else if (userRole === 'faculty') {
      user = await User.findOne({ staff_id: identifier, role: 'faculty', active: 1 });
      if (!user) {
        return res.status(401).json({ field: 'identifier', message: 'Invalid Staff ID' });
      }
    }

    const valid = await bcrypt.compare(password, user.password);
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select('id name email role department phone register_number staff_id active');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { login, me };
