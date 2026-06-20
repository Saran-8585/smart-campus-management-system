const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  exam_type: { type: String, enum: ['Mid', 'Final', 'Assignment'], required: true },
  marks_obtained: { type: Number, required: true },
  max_marks: { type: Number, required: true },
  semester: { type: Number, required: true },
  date: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } },
});

marksSchema.index({ student_id: 1, subject_id: 1, exam_type: 1 }, { unique: true });

module.exports = mongoose.model('Marks', marksSchema);
