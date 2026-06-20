const router = require('express').Router();
const { getBySubject, save, getByStudent, getAll } = require('../controllers/marks');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', requireRole('admin'), getAll);
router.get('/subject/:subjectId', requireRole('admin', 'faculty'), getBySubject);
router.post('/', requireRole('admin', 'faculty'), save);
router.get('/student/:studentId', getByStudent);

module.exports = router;
