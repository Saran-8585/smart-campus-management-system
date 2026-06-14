const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  day: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  room: { type: String, required: true },
  semester: { type: Number, required: true },
  faculty_name: String,
  department: String,
  section: String,
  is_active: { type: Number, default: 1, enum: [0, 1] },
  deactivated_at: Date,
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } },
});

module.exports = mongoose.model('Timetable', timetableSchema);
