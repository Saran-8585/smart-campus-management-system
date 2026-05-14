const router = require('express').Router();
const { getAll, create, remove } = require('../controllers/notices');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getAll);
router.post('/', requireRole('admin', 'faculty'), create);
router.delete('/:id', requireRole('admin'), remove);

module.exports = router;
