const mongoose = require('mongoose');

const roomBookingSchema = new mongoose.Schema({
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  booked_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  purpose: String,
  date: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'], default: 'Pending' },
  remarks: String,
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewed_at: Date,
}, { timestamps: true, toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } } });

roomBookingSchema.index({ room_id: 1, date: 1, start_time: 1, end_time: 1 });
roomBookingSchema.index({ booked_by: 1, date: -1 });

module.exports = mongoose.model('RoomBooking', roomBookingSchema);
