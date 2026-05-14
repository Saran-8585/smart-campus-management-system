const router = require('express').Router();
const { getByStudent, save } = require('../controllers/marks');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/:studentId', getByStudent);
router.post('/', requireRole('admin', 'faculty'), save);

module.exports = router;
