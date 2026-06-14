const mongoose = require('mongoose');

const navigationHistorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  search_query: { type: String, required: true },
  place_id: { type: mongoose.Schema.Types.ObjectId, ref: 'NavigationPlace', default: null },
  place_name: String,
  searched_at: { type: Date, default: Date.now },
  is_hidden: { type: Number, default: 0, enum: [0, 1] },
}, {
  toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } },
});

module.exports = mongoose.model('NavigationHistory', navigationHistorySchema);
