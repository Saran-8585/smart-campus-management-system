const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function getAll(req, res) {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const users = await User.find(filter).select('id name email role department phone register_number staff_id active created_at').sort({ created_at: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function create(req, res) {
  try {
    const { name, email, password, role, department, phone, register_number, staff_id } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashed, role,
      department: department || null,
      phone: phone || null,
      register_number: register_number || null,
      staff_id: staff_id || null,
    });
    const returned = await User.findById(user._id).select('id name email role department phone register_number staff_id active created_at');
    res.status(201).json(returned);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const existing = await User.findById(id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const { name, email, password, role, department, phone, active, register_number, staff_id } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (password) updates.password = await bcrypt.hash(password, 10);
    if (role !== undefined) updates.role = role;
    if (department !== undefined) updates.department = department;
    if (phone !== undefined) updates.phone = phone;
    if (active !== undefined) updates.active = active ? 1 : 0;
    if (register_number !== undefined) updates.register_number = register_number;
    if (staff_id !== undefined) updates.staff_id = staff_id;

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });

    await User.findByIdAndUpdate(id, updates);
    const user = await User.findById(id).select('id name email role department phone register_number staff_id active created_at');
    res.json(user);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getAll, create, update };
