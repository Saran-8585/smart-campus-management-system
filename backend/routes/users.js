const router = require('express').Router();
const { getAll, create, update } = require('../controllers/users');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', requireRole('admin'), getAll);
router.post('/', requireRole('admin'), create);
router.put('/:id', requireRole('admin'), update);

module.exports = router;
