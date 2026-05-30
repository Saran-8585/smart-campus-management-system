const { getDB } = require('../db/database');

function list(req, res) {
  const db = getDB();
  const { type, category, status, date_from, date_to, search } = req.query;
  let query = `
    SELECT lf.*, u.name AS posted_by_name
    FROM lost_found_items lf
    JOIN users u ON u.id = lf.posted_by
    WHERE 1=1
  `;
  const params = [];
  if (type) { query += ' AND lf.type = ?'; params.push(type); }
  if (category) { query += ' AND lf.category = ?'; params.push(category); }
  if (status) { query += ' AND lf.status = ?'; params.push(status); }
  if (date_from) { query += ' AND lf.date_occurred >= ?'; params.push(date_from); }
  if (date_to) { query += ' AND lf.date_occurred <= ?'; params.push(date_to); }
  if (search) { query += ' AND lf.item_name LIKE ?'; params.push(`%${search}%`); }
  query += ' ORDER BY lf.created_at DESC';
  const items = db.prepare(query).all(...params);
  res.json(items);
}

function create(req, res) {
  const { type, item_name, description, category, date_occurred, location, contact_info, where_item_now } = req.body;
  if (!item_name || !type) return res.status(400).json({ error: 'Item name and type are required' });
  const image_path = req.file ? '/uploads/lost-found/' + req.file.filename : null;
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 30);
  const db = getDB();
  const info = db.prepare(`
    INSERT INTO lost_found_items (posted_by, type, item_name, description, category, date_occurred, location, image_path, contact_info, where_item_now, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, type, item_name, description || null, category || 'Other', date_occurred || null, location || null, image_path, contact_info || null, where_item_now || null, expires_at.toISOString());
  const item = db.prepare('SELECT * FROM lost_found_items WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(item);
}

function getOne(req, res) {
  const db = getDB();
  const item = db.prepare(`
    SELECT lf.*, u.name AS posted_by_name, u.email AS posted_by_email
    FROM lost_found_items lf
    JOIN users u ON u.id = lf.posted_by
    WHERE lf.id = ?
  `).get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
}

function createClaim(req, res) {
  const { id } = req.params;
  const { claim_description } = req.body;
  if (!claim_description) return res.status(400).json({ error: 'Claim description is required' });
  const db = getDB();
  const item = db.prepare('SELECT * FROM lost_found_items WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.status !== 'Active') return res.status(400).json({ error: 'Item is not available for claiming' });
  const proof_image_path = req.file ? '/uploads/lost-found/' + req.file.filename : null;
  const info = db.prepare(`
    INSERT INTO lost_found_claims (item_id, claimant_id, claim_description, proof_image_path)
    VALUES (?, ?, ?, ?)
  `).run(id, req.user.id, claim_description, proof_image_path);
  const claim = db.prepare('SELECT * FROM lost_found_claims WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(claim);
}

function getClaims(req, res) {
  const db = getDB();
  const item = db.prepare('SELECT * FROM lost_found_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.posted_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the item poster can view claims' });
  }
  const claims = db.prepare(`
    SELECT lfc.*, u.name AS claimant_name, u.email AS claimant_email, u.phone AS claimant_phone
    FROM lost_found_claims lfc
    JOIN users u ON u.id = lfc.claimant_id
    WHERE lfc.item_id = ?
    ORDER BY lfc.submitted_at DESC
  `).all(req.params.id);
  res.json(claims);
}

function approveClaim(req, res) {
  const db = getDB();
  const claim = db.prepare(`
    SELECT lfc.*, lf.posted_by AS item_owner_id
    FROM lost_found_claims lfc
    JOIN lost_found_items lf ON lf.id = lfc.item_id
    WHERE lfc.id = ?
  `).get(req.params.claimId);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  if (claim.item_owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the item owner can approve claims' });
  }
  if (claim.status !== 'Pending') return res.status(400).json({ error: 'Claim is not pending' });
  db.prepare("UPDATE lost_found_claims SET status = 'Approved', resolved_at = datetime('now') WHERE id = ?").run(req.params.claimId);
  db.prepare("UPDATE lost_found_items SET status = 'Claimed' WHERE id = ?").run(claim.item_id);
  db.prepare("UPDATE lost_found_claims SET status = 'Rejected', resolved_at = datetime('now') WHERE item_id = ? AND id != ? AND status = 'Pending'").run(claim.item_id, req.params.claimId);
  const updated = db.prepare(`
    SELECT lfc.*, u.name AS claimant_name, u.email AS claimant_email, u.phone AS claimant_phone
    FROM lost_found_claims lfc
    JOIN users u ON u.id = lfc.claimant_id
    WHERE lfc.id = ?
  `).get(req.params.claimId);
  res.json(updated);
}

function rejectClaim(req, res) {
  const db = getDB();
  const claim = db.prepare(`
    SELECT lfc.*, lf.posted_by AS item_owner_id
    FROM lost_found_claims lfc
    JOIN lost_found_items lf ON lf.id = lfc.item_id
    WHERE lfc.id = ?
  `).get(req.params.claimId);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  if (claim.item_owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the item owner can reject claims' });
  }
  if (claim.status !== 'Pending') return res.status(400).json({ error: 'Claim is not pending' });
  db.prepare("UPDATE lost_found_claims SET status = 'Rejected', resolved_at = datetime('now') WHERE id = ?").run(req.params.claimId);
  const updated = db.prepare(`
    SELECT lfc.*, u.name AS claimant_name
    FROM lost_found_claims lfc
    JOIN users u ON u.id = lfc.claimant_id
    WHERE lfc.id = ?
  `).get(req.params.claimId);
  res.json(updated);
}

function adminList(req, res) {
  const db = getDB();
  const { status, category, type, date_from, date_to } = req.query;
  let query = `
    SELECT lf.*, u.name AS posted_by_name, u.email AS posted_by_email
    FROM lost_found_items lf
    JOIN users u ON u.id = lf.posted_by
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND lf.status = ?'; params.push(status); }
  if (category) { query += ' AND lf.category = ?'; params.push(category); }
  if (type) { query += ' AND lf.type = ?'; params.push(type); }
  if (date_from) { query += ' AND lf.created_at >= ?'; params.push(date_from); }
  if (date_to) { query += ' AND lf.created_at <= ?'; params.push(date_to); }
  query += ' ORDER BY lf.created_at DESC';
  const items = db.prepare(query).all(...params);
  res.json(items);
}

function adminClaims(req, res) {
  const db = getDB();
  const { status } = req.query;
  let query = `
    SELECT lfc.*, u.name AS claimant_name, u.email AS claimant_email,
           lf.item_name, lf.type AS item_type
    FROM lost_found_claims lfc
    JOIN users u ON u.id = lfc.claimant_id
    JOIN lost_found_items lf ON lf.id = lfc.item_id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND lfc.status = ?'; params.push(status); }
  query += ' ORDER BY lfc.submitted_at DESC';
  const claims = db.prepare(query).all(...params);
  res.json(claims);
}

function removeItem(req, res) {
  const db = getDB();
  const existing = db.prepare('SELECT id FROM lost_found_items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });
  db.prepare("UPDATE lost_found_items SET status = 'Expired' WHERE id = ?").run(req.params.id);
  res.json({ message: 'Item deactivated' });
}

module.exports = { list, create, getOne, createClaim, getClaims, approveClaim, rejectClaim, adminList, adminClaims, removeItem };
