const router = require('express').Router();
const { attendanceSummary, marksSummary } = require('../controllers/reports');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/attendance-summary', requireRole('admin'), attendanceSummary);
router.get('/marks-summary', requireRole('admin'), marksSummary);

module.exports = router;
