const router = require('express').Router();
const { attendanceSummary } = require('../controllers/reports');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/attendance-summary', requireRole('admin'), attendanceSummary);

module.exports = router;
