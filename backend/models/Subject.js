const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  credits: { type: Number, default: 3 },
  faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  active: { type: Number, default: 1, enum: [0, 1] },
}, {
  toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } },
});

module.exports = mongoose.model('Subject', subjectSchema);
