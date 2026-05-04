const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getIncidents, verifyIncident, toggleIncidentActive, deleteIncident,
  getUsers, toggleUserActive, setUserRole, updateUserTrust,
  getSosAlerts, resolveSosAlert,
  getStats,
} = require('../controllers/adminController');

router.use(authenticate, requireRole('admin', 'moderator'));

router.get('/stats', getStats);
router.get('/incidents', getIncidents);
router.patch('/incidents/:id/verify', requireRole('admin', 'moderator'), verifyIncident);
router.patch('/incidents/:id/toggle', requireRole('admin', 'moderator'), toggleIncidentActive);
router.delete('/incidents/:id', requireRole('admin'), deleteIncident);
router.get('/users', requireRole('admin'), getUsers);
router.patch('/users/:id/toggle', requireRole('admin'), toggleUserActive);
router.patch('/users/:id/role', requireRole('admin'), setUserRole);
router.patch('/users/:id/trust', requireRole('admin'), updateUserTrust);
router.get('/sos', getSosAlerts);
router.patch('/sos/:id/resolve', resolveSosAlert);

module.exports = router;
