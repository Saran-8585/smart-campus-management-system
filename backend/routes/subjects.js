const router = require('express').Router();
const { getAll, create, getStudents, update, remove } = require('../controllers/subjects');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getAll);
router.post('/', requireRole('admin'), create);
router.put('/:id', requireRole('admin'), update);
router.delete('/:id', requireRole('admin'), remove);
router.get('/:id/students', requireRole('admin', 'faculty'), getStudents);

module.exports = router;
