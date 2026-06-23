const router = require('express').Router();
const {
  list, getById, create, update, remove,
  dashboard, timeline, utilization, exportCSV,
  createBooking, listMyBookings, listAllBookings, reviewBooking, cancelBooking,
  createIssue, listIssues, updateIssueStatus,
} = require('../controllers/room');
const { authenticate, requireRole } = require('../middleware/auth');

// Room CRUD
router.get('/', authenticate, list);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, requireRole('admin'), create);
router.put('/:id', authenticate, requireRole('admin'), update);
router.delete('/:id', authenticate, requireRole('admin'), remove);

// Dashboard & Timeline
router.get('/data/dashboard', authenticate, dashboard);
router.get('/data/timeline', authenticate, timeline);
router.get('/data/utilization', authenticate, utilization);
router.get('/data/export', authenticate, exportCSV);

// Bookings
router.post('/bookings', authenticate, createBooking);
router.get('/bookings/mine', authenticate, listMyBookings);
router.get('/bookings/all', authenticate, requireRole('admin'), listAllBookings);
router.patch('/bookings/:id/review', authenticate, requireRole('admin'), reviewBooking);
router.patch('/bookings/:id/cancel', authenticate, cancelBooking);

// Issues
router.post('/issues', authenticate, createIssue);
router.get('/issues', authenticate, listIssues);
router.patch('/issues/:id/status', authenticate, requireRole('admin'), updateIssueStatus);

module.exports = router;
