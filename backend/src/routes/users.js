const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getProfile, updateProfile, updateLocation, getLeaderboard, getAllUsers, sosAlert,
  createShareSession, getShareSession, updateSharePosition, stopShareSession,
} = require('../controllers/userController');

router.get('/leaderboard', getLeaderboard);
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.post('/me/location', authenticate, updateLocation);
router.post('/sos', authenticate, sosAlert);
router.post('/share-location', authenticate, createShareSession);
router.get('/share-location/:token', getShareSession);
router.put('/share-location/:token', authenticate, updateSharePosition);
router.delete('/share-location/:token', authenticate, stopShareSession);
router.get('/', authenticate, requireRole('admin'), getAllUsers);
router.get('/:id', getProfile);

module.exports = router;
