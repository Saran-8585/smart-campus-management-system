const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  block: { type: String, required: true },
  floor: { type: String, required: true },
  capacity: { type: Number, required: true, default: 60 },
  room_type: { type: String, enum: ['Classroom', 'Lab', 'Seminar Hall', 'Lecture Hall', 'Conference Room'], default: 'Classroom' },
  facilities: [String],
  equipment: [String],
  status: { type: String, enum: ['Active', 'Maintenance', 'Closed'], default: 'Active' },
  description: String,
}, { timestamps: true, toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } } });

module.exports = mongoose.model('Room', roomSchema);
