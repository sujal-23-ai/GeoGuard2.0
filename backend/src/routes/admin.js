const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getIncidents, verifyIncident, toggleIncidentActive,
  getUsers, toggleUserActive, setUserRole, getStats,
} = require('../controllers/adminController');

router.use(authenticate, requireRole('admin', 'moderator'));

router.get('/stats', getStats);
router.get('/incidents', getIncidents);
router.patch('/incidents/:id/verify', requireRole('admin', 'moderator'), verifyIncident);
router.patch('/incidents/:id/toggle', requireRole('admin', 'moderator'), toggleIncidentActive);
router.get('/users', requireRole('admin'), getUsers);
router.patch('/users/:id/toggle', requireRole('admin'), toggleUserActive);
router.patch('/users/:id/role', requireRole('admin'), setUserRole);

module.exports = router;
