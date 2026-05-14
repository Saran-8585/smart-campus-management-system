const router = require('express').Router();
const { getTimetable, create, remove } = require('../controllers/timetable');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getTimetable);
router.post('/', requireRole('admin'), create);
router.delete('/:id', requireRole('admin'), remove);

module.exports = router;
