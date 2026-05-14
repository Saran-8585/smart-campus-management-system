const router = require('express').Router();
const { getBySubject, save, getByStudent } = require('../controllers/attendance');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/:subjectId', requireRole('admin', 'faculty'), getBySubject);
router.post('/', requireRole('admin', 'faculty'), save);
router.get('/student/:studentId', getByStudent);

module.exports = router;
