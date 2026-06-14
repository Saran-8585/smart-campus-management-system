const Notice = require('../models/Notice');

async function getAll(req, res) {
  try {
    const user = req.user;
    let notices;

    if (user.role === 'admin') {
      notices = await Notice.find({ active: 1 }).populate('posted_by', 'name').sort({ created_at: -1 });
    } else if (user.role === 'faculty') {
      notices = await Notice.find({ active: 1, target_role: { $in: ['all', 'faculty'] } })
        .populate('posted_by', 'name').sort({ created_at: -1 });
    } else {
      notices = await Notice.find({ active: 1, target_role: { $in: ['all', 'student'] } })
        .populate('posted_by', 'name').sort({ created_at: -1 });
    }

    const mapped = notices.map(n => ({
      id: n.id, _id: n._id, title: n.title, body: n.body, category: n.category,
      posted_by: n.posted_by?._id || n.posted_by,
      poster_name: n.posted_by?.name || null,
      target_role: n.target_role, active: n.active, created_at: n.created_at,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function create(req, res) {
  try {
    const { title, body, category, target_role } = req.body;
    if (!title || !body || !category) {
      return res.status(400).json({ error: 'Title, body, and category are required' });
    }
    const validCategories = ['Exam', 'Event', 'Holiday', 'General'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const notice = await Notice.create({
      title, body, category, posted_by: req.user.id,
      target_role: target_role || 'all',
    });
    const populated = await Notice.findById(notice._id).populate('posted_by', 'name');
    res.status(201).json({
      id: populated.id, _id: populated._id, title: populated.title, body: populated.body,
      category: populated.category, posted_by: populated.posted_by?._id || populated.posted_by,
      poster_name: populated.posted_by?.name || null,
      target_role: populated.target_role, active: populated.active, created_at: populated.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const existing = await Notice.findById(id);
    if (!existing) return res.status(404).json({ error: 'Notice not found' });
    await Notice.findByIdAndUpdate(id, { active: 0 });
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getAll, create, remove };
