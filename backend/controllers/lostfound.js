const LostFoundItem = require('../models/LostFoundItem');
const LostFoundClaim = require('../models/LostFoundClaim');
const User = require('../models/User');

async function list(req, res) {
  try {
    const { type, category, status, date_from, date_to, search, posted_by } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    filter.status = 'Active';
    if (status) {
      delete filter.status;
      filter.status = status;
    }
    if (date_from) filter.date_occurred = { ...filter.date_occurred, $gte: date_from };
    if (date_to) filter.date_occurred = { ...filter.date_occurred, $lte: date_to };
    if (search) filter.item_name = { $regex: search, $options: 'i' };
    if (posted_by) filter.posted_by = posted_by;

    const items = await LostFoundItem.find(filter)
      .populate('posted_by', 'name')
      .sort({ created_at: -1 });

    const mapped = items.map(i => ({
      id: i.id, _id: i._id, posted_by: i.posted_by?._id || i.posted_by,
      posted_by_name: i.posted_by?.name || null,
      type: i.type, item_name: i.item_name, description: i.description,
      category: i.category, date_occurred: i.date_occurred, location: i.location,
      image_path: i.image_path, contact_info: i.contact_info, where_item_now: i.where_item_now,
      status: i.status, created_at: i.created_at, expires_at: i.expires_at,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function create(req, res) {
  try {
    const { type, item_name, description, category, date_occurred, location, contact_info, where_item_now } = req.body;
    if (!item_name || !type) return res.status(400).json({ error: 'Item name and type are required' });
    const image_path = req.file ? '/uploads/lost-found/' + req.file.filename : null;
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 30);

    const item = await LostFoundItem.create({
      posted_by: req.user.id, type, item_name,
      description: description || null,
      category: category || 'Other',
      date_occurred: date_occurred || null,
      location: location || null,
      image_path,
      contact_info: contact_info || null,
      where_item_now: where_item_now || null,
      expires_at,
    });

    const created = await LostFoundItem.findById(item._id);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getOne(req, res) {
  try {
    const item = await LostFoundItem.findById(req.params.id)
      .populate('posted_by', 'name email');
    if (!item) return res.status(404).json({ error: 'Item not found' });
    const mapped = {
      id: item.id, _id: item._id, posted_by: item.posted_by?._id || item.posted_by,
      posted_by_name: item.posted_by?.name || null,
      posted_by_email: item.posted_by?.email || null,
      type: item.type, item_name: item.item_name, description: item.description,
      category: item.category, date_occurred: item.date_occurred, location: item.location,
      image_path: item.image_path, contact_info: item.contact_info, where_item_now: item.where_item_now,
      status: item.status, created_at: item.created_at, expires_at: item.expires_at,
    };
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createClaim(req, res) {
  try {
    const { id } = req.params;
    const { claim_description } = req.body;
    if (!claim_description) return res.status(400).json({ error: 'Claim description is required' });

    const item = await LostFoundItem.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.status !== 'Active') return res.status(400).json({ error: 'Item is not available for claiming' });

    const proof_image_path = req.file ? '/uploads/lost-found/' + req.file.filename : null;
    const claim = await LostFoundClaim.create({
      item_id: id,
      claimant_id: req.user.id,
      claim_description,
      proof_image_path,
    });

    const created = await LostFoundClaim.findById(claim._id);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getClaims(req, res) {
  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (String(item.posted_by) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the item poster can view claims' });
    }

    const claims = await LostFoundClaim.find({ item_id: req.params.id })
      .populate('claimant_id', 'name email phone')
      .sort({ submitted_at: -1 });

    const mapped = claims.map(c => ({
      id: c.id, _id: c._id, item_id: c.item_id, claimant_id: c.claimant_id?._id || c.claimant_id,
      claimant_name: c.claimant_id?.name || null,
      claimant_email: c.claimant_id?.email || null,
      claimant_phone: c.claimant_id?.phone || null,
      claim_description: c.claim_description, proof_image_path: c.proof_image_path,
      status: c.status, submitted_at: c.submitted_at, resolved_at: c.resolved_at,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function approveClaim(req, res) {
  try {
    const claim = await LostFoundClaim.findById(req.params.claimId).populate('item_id', 'posted_by');
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    const itemOwnerId = String(claim.item_id?.posted_by);
    if (itemOwnerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the item owner can approve claims' });
    }
    if (claim.status !== 'Pending') return res.status(400).json({ error: 'Claim is not pending' });

    await LostFoundClaim.findByIdAndUpdate(req.params.claimId, {
      status: 'Approved',
      resolved_at: new Date(),
    });
    await LostFoundItem.findByIdAndUpdate(claim.item_id._id, { status: 'Claimed' });
    await LostFoundClaim.updateMany(
      { item_id: claim.item_id._id, _id: { $ne: req.params.claimId }, status: 'Pending' },
      { $set: { status: 'Rejected', resolved_at: new Date() } }
    );

    const updated = await LostFoundClaim.findById(req.params.claimId)
      .populate('claimant_id', 'name email phone');
    res.json({
      id: updated.id, _id: updated._id, item_id: updated.item_id,
      claimant_id: updated.claimant_id?._id || updated.claimant_id,
      claimant_name: updated.claimant_id?.name || null,
      claimant_email: updated.claimant_id?.email || null,
      claimant_phone: updated.claimant_id?.phone || null,
      claim_description: updated.claim_description, proof_image_path: updated.proof_image_path,
      status: updated.status, submitted_at: updated.submitted_at, resolved_at: updated.resolved_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function rejectClaim(req, res) {
  try {
    const claim = await LostFoundClaim.findById(req.params.claimId).populate('item_id', 'posted_by');
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    const itemOwnerId = String(claim.item_id?.posted_by);
    if (itemOwnerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the item owner can reject claims' });
    }
    if (claim.status !== 'Pending') return res.status(400).json({ error: 'Claim is not pending' });

    await LostFoundClaim.findByIdAndUpdate(req.params.claimId, {
      status: 'Rejected',
      resolved_at: new Date(),
    });

    const updated = await LostFoundClaim.findById(req.params.claimId)
      .populate('claimant_id', 'name');
    res.json({
      id: updated.id, _id: updated._id, item_id: updated.item_id,
      claimant_id: updated.claimant_id?._id || updated.claimant_id,
      claimant_name: updated.claimant_id?.name || null,
      claim_description: updated.claim_description, proof_image_path: updated.proof_image_path,
      status: updated.status, submitted_at: updated.submitted_at, resolved_at: updated.resolved_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function adminList(req, res) {
  try {
    const { status, category, type, date_from, date_to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (date_from || date_to) {
      filter.created_at = {};
      if (date_from) filter.created_at.$gte = new Date(date_from);
      if (date_to) filter.created_at.$lte = new Date(date_to);
    }

    const items = await LostFoundItem.find(filter)
      .populate('posted_by', 'name email')
      .sort({ created_at: -1 });

    const mapped = items.map(i => ({
      id: i.id, _id: i._id, posted_by: i.posted_by?._id || i.posted_by,
      posted_by_name: i.posted_by?.name || null,
      posted_by_email: i.posted_by?.email || null,
      type: i.type, item_name: i.item_name, description: i.description,
      category: i.category, date_occurred: i.date_occurred, location: i.location,
      image_path: i.image_path, contact_info: i.contact_info, where_item_now: i.where_item_now,
      status: i.status, created_at: i.created_at, expires_at: i.expires_at,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function adminClaims(req, res) {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const claims = await LostFoundClaim.find(filter)
      .populate('claimant_id', 'name email')
      .populate('item_id', 'item_name type')
      .sort({ submitted_at: -1 });

    const mapped = claims.map(c => ({
      id: c.id, _id: c._id, item_id: c.item_id?._id || c.item_id,
      item_name: c.item_id?.item_name || null,
      item_type: c.item_id?.type || null,
      claimant_id: c.claimant_id?._id || c.claimant_id,
      claimant_name: c.claimant_id?.name || null,
      claimant_email: c.claimant_id?.email || null,
      claim_description: c.claim_description, proof_image_path: c.proof_image_path,
      status: c.status, submitted_at: c.submitted_at, resolved_at: c.resolved_at,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function removeItem(req, res) {
  try {
    const existing = await LostFoundItem.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    await LostFoundItem.findByIdAndUpdate(req.params.id, { status: 'Expired' });
    res.json({ message: 'Item deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { list, create, getOne, createClaim, getClaims, approveClaim, rejectClaim, adminList, adminClaims, removeItem };
