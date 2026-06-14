const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, required: true, enum: ['Exam', 'Event', 'Holiday', 'General'] },
  posted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  target_role: { type: String, default: 'all', enum: ['all', 'student', 'faculty', 'admin'] },
  active: { type: Number, default: 1, enum: [0, 1] },
  created_at: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } },
});

module.exports = mongoose.model('Notice', noticeSchema);
