const router = require('express').Router();
const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');
const { incidentLimiter } = require('../middleware/rateLimiter');
const {
  createIncident, getNearby, getAll, getById,
  voteIncident, deleteIncident, getAnalytics, confirmIncident, createValidation,
} = require('../controllers/incidentController');

router.get('/nearby', getNearby);
router.get('/analytics', getAnalytics);
router.get('/', getAll);
router.get('/:id', getById);

router.post('/', authenticate, incidentLimiter, createValidation, createIncident);
router.post('/:id/vote', authenticate, voteIncident);
router.post('/:id/confirm', authenticate, confirmIncident);
router.delete('/:id', authenticate, deleteIncident);

module.exports = router;
