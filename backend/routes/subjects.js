const router = require('express').Router();
const { getAll, create, getStudents } = require('../controllers/subjects');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getAll);
router.post('/', requireRole('admin'), create);
router.get('/:id/students', requireRole('admin', 'faculty'), getStudents);

module.exports = router;
