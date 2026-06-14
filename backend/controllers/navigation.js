const { getDB } = require('../db/database');

function search(req, res) {
  const { q } = req.query;
  if (!q) return res.json([]);
  const db = getDB();
  const places = db.prepare(
    'SELECT id, name, block, floor, category FROM navigation_places WHERE name LIKE ? ORDER BY name LIMIT 15'
  ).all(`%${q}%`);
  res.json(places);
}

function getPlace(req, res) {
  const db = getDB();
  const place = db.prepare('SELECT * FROM navigation_places WHERE id = ?').get(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });
  res.json(place);
}

function getHistory(req, res) {
  const db = getDB();
  const history = db.prepare(
    "SELECT id, search_query, place_id, place_name, searched_at FROM navigation_history WHERE user_id = ? AND is_hidden = 0 ORDER BY searched_at DESC LIMIT 10"
  ).all(req.user.id);
  res.json(history);
}

function saveHistory(req, res) {
  const { search_query, place_id, place_name } = req.body;
  if (!search_query) return res.status(400).json({ error: 'search_query is required' });
  const db = getDB();
  db.prepare(
    'INSERT INTO navigation_history (user_id, search_query, place_id, place_name) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, search_query, place_id || null, place_name || null);
  res.status(201).json({ message: 'Saved' });
}

function clearHistory(req, res) {
  const db = getDB();
  db.prepare(
    "UPDATE navigation_history SET is_hidden = 1 WHERE user_id = ?"
  ).run(req.user.id);
  res.json({ message: 'History cleared' });
}

function getAllHistory(req, res) {
  const db = getDB();
  const { user_id, search_query, date_from, date_to } = req.query;
  let query = `
    SELECT nh.*, u.name AS user_name
    FROM navigation_history nh
    JOIN users u ON u.id = nh.user_id
    WHERE 1=1
  `;
  const params = [];
  if (user_id) { query += ' AND nh.user_id = ?'; params.push(user_id); }
  if (search_query) { query += ' AND nh.search_query LIKE ?'; params.push(`%${search_query}%`); }
  if (date_from) { query += ' AND nh.searched_at >= ?'; params.push(date_from); }
  if (date_to) { query += ' AND nh.searched_at <= ?'; params.push(date_to); }
  query += ' ORDER BY nh.searched_at DESC LIMIT 100';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
}

module.exports = { search, getPlace, getHistory, saveHistory, clearHistory, getAllHistory };
