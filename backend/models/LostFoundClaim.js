const mongoose = require('mongoose');

const lostFoundClaimSchema = new mongoose.Schema({
  item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LostFoundItem', required: true },
  claimant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  claim_description: String,
  proof_image_path: String,
  status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'] },
  submitted_at: { type: Date, default: Date.now },
  resolved_at: Date,
}, {
  toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; } },
});

module.exports = mongoose.model('LostFoundClaim', lostFoundClaimSchema);
