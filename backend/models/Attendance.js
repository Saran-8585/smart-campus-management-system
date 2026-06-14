const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: String, required: true },
  status: { type: String, required: true, enum: ['Present', 'Absent', 'Late'] },
}, {
  toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } },
});

attendanceSchema.index({ student_id: 1, subject_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
