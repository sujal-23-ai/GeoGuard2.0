const router = require('express').Router();
const { upload, uploadFiles } = require('../controllers/mediaController');
const { optionalAuth } = require('../middleware/auth');

// POST /api/media/upload — upload up to 5 files (auth optional)
router.post('/upload', optionalAuth, upload.array('files', 5), uploadFiles);

module.exports = router;
