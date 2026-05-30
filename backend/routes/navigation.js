const router = require('express').Router();
const { search, getPlace, getHistory, saveHistory, clearHistory, getAllHistory } = require('../controllers/navigation');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/search', authenticate, search);
router.get('/place/:id', authenticate, getPlace);
router.get('/history', authenticate, getHistory);
router.post('/history', authenticate, saveHistory);
router.delete('/history', authenticate, clearHistory);
router.get('/history/all', authenticate, requireRole('admin'), getAllHistory);

module.exports = router;
