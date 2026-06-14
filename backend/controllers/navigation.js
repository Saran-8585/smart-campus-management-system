const NavigationPlace = require('../models/NavigationPlace');
const NavigationHistory = require('../models/NavigationHistory');

async function search(req, res) {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const places = await NavigationPlace.find(
      { name: { $regex: q, $options: 'i' } },
      'id name block floor category'
    ).sort({ name: 1 }).limit(15);
    res.json(places);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getPlace(req, res) {
  try {
    const place = await NavigationPlace.findById(req.params.id);
    if (!place) return res.status(404).json({ error: 'Place not found' });
    res.json(place);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getHistory(req, res) {
  try {
    const history = await NavigationHistory.find(
      { user_id: req.user.id, is_hidden: 0 },
      'id search_query place_id place_name searched_at'
    ).sort({ searched_at: -1 }).limit(10);
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function saveHistory(req, res) {
  try {
    const { search_query, place_id, place_name } = req.body;
    if (!search_query) return res.status(400).json({ error: 'search_query is required' });
    await NavigationHistory.create({
      user_id: req.user.id,
      search_query,
      place_id: place_id || null,
      place_name: place_name || null,
    });
    res.status(201).json({ message: 'Saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function clearHistory(req, res) {
  try {
    await NavigationHistory.updateMany(
      { user_id: req.user.id },
      { $set: { is_hidden: 1 } }
    );
    res.json({ message: 'History cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAllHistory(req, res) {
  try {
    const { user_id, search_query, date_from, date_to } = req.query;
    const filter = {};
    if (user_id) filter.user_id = user_id;
    if (search_query) filter.search_query = { $regex: search_query, $options: 'i' };
    if (date_from || date_to) {
      filter.searched_at = {};
      if (date_from) filter.searched_at.$gte = new Date(date_from);
      if (date_to) filter.searched_at.$lte = new Date(date_to);
    }

    const rows = await NavigationHistory.find(filter)
      .populate('user_id', 'name')
      .sort({ searched_at: -1 })
      .limit(100);

    const mapped = rows.map(r => ({
      id: r.id, _id: r._id, user_id: r.user_id?._id || r.user_id,
      user_name: r.user_id?.name || null,
      search_query: r.search_query, place_id: r.place_id, place_name: r.place_name,
      searched_at: r.searched_at, is_hidden: r.is_hidden,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { search, getPlace, getHistory, saveHistory, clearHistory, getAllHistory };
