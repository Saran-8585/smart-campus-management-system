const mongoose = require('mongoose');

const roomIssueSchema = new mongoose.Schema({
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  reported_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['Electrical', 'Plumbing', 'Furniture', 'Equipment', 'Cleaning', 'Other'], required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  image_path: String,
  resolved_at: Date,
  resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolution_notes: String,
}, { timestamps: true, toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } } });

module.exports = mongoose.model('RoomIssue', roomIssueSchema);
