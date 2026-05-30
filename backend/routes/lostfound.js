const router = require('express').Router();
const {
  list, create, getOne, createClaim, getClaims,
  approveClaim, rejectClaim, adminList, adminClaims, removeItem
} = require('../controllers/lostfound');
const { authenticate, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/lost-found'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', list);
router.post('/', authenticate, upload.single('image'), create);
router.get('/:id', getOne);
router.post('/:id/claim', authenticate, upload.single('proof_image'), createClaim);
router.get('/:id/claims', authenticate, getClaims);
router.patch('/claims/:claimId/approve', authenticate, approveClaim);
router.patch('/claims/:claimId/reject', authenticate, rejectClaim);

router.get('/admin/all', authenticate, requireRole('admin'), adminList);
router.get('/admin/claims', authenticate, requireRole('admin'), adminClaims);
router.delete('/admin/:id', authenticate, requireRole('admin'), removeItem);

module.exports = router;
