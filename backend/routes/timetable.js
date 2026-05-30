const router = require('express').Router();
const { getTimetable, create, update, remove, getHistory } = require('../controllers/timetable');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getTimetable);
router.get('/history', requireRole('admin'), getHistory);
router.post('/', requireRole('admin'), create);
router.put('/:id', requireRole('admin'), update);
router.delete('/:id', requireRole('admin'), remove);

module.exports = router;
