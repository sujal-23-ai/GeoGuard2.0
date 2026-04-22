const router = require('express').Router();
const { getRiskPrediction, getZoneAnalysis, askAiAssistant } = require('../controllers/predictionController');

router.get('/risk',     getRiskPrediction);
router.get('/zone',     getZoneAnalysis);
router.post('/ask',     askAiAssistant);

module.exports = router;
