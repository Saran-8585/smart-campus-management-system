const mongoose = require('mongoose');

const lostFoundItemSchema = new mongoose.Schema({
  posted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['Lost', 'Found'] },
  item_name: { type: String, required: true },
  description: String,
  category: { type: String, default: 'Other' },
  date_occurred: String,
  location: String,
  image_path: String,
  contact_info: String,
  where_item_now: String,
  status: { type: String, default: 'Active', enum: ['Active', 'Claimed', 'Expired'] },
  created_at: { type: Date, default: Date.now },
  expires_at: Date,
}, {
  toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } },
});

module.exports = mongoose.model('LostFoundItem', lostFoundItemSchema);
