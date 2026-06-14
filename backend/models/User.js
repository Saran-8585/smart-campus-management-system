const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'faculty', 'student'] },
  department: String,
  phone: String,
  register_number: { type: String, unique: true, sparse: true },
  staff_id: { type: String, unique: true, sparse: true },
  active: { type: Number, default: 1, enum: [0, 1] },
  created_at: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } },
});

module.exports = mongoose.model('User', userSchema);
