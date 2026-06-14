const mongoose = require('mongoose');

const navigationPlaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  block: String,
  floor: String,
  description: String,
  landmark_hint: String,
  directions_from_gate: String,
  map_x: { type: Number, default: 0 },
  map_y: { type: Number, default: 0 },
  category: String,
  created_at: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } },
});

module.exports = mongoose.model('NavigationPlace', navigationPlaceSchema);
