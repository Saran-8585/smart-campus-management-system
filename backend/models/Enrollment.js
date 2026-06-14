const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
}, {
  toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } },
});

enrollmentSchema.index({ student_id: 1, subject_id: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
