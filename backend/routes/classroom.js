const router = require('express').Router();
const { status } = require('../controllers/classroom');
const { authenticate } = require('../middleware/auth');

router.get('/status', authenticate, status);

module.exports = router;
