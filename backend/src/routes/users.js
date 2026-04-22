const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getProfile, updateProfile, updateLocation, getLeaderboard, getAllUsers, sosAlert } = require('../controllers/userController');

router.get('/leaderboard', getLeaderboard);
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.post('/me/location', authenticate, updateLocation);
router.post('/sos', authenticate, sosAlert);
router.get('/', authenticate, requireRole('admin'), getAllUsers);
router.get('/:id', getProfile);

module.exports = router;
