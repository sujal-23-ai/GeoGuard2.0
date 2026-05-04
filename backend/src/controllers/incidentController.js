const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const Incident = require('../models/incident');
const User = require('../models/user');
const { cacheGet, cacheSet, cacheDelPattern } = require('../config/redis');
const { verifyIncident, validateIncidentText } = require('../services/aiVerification.service');

const createValidation = [
  body('category').notEmpty().trim(),
  body('title').trim().isLength({ min: 3, max: 255 }),
  body('severity').isInt({ min: 1, max: 5 }),
  body('lng').isFloat({ min: -180, max: 180 }),
  body('lat').isFloat({ min: -90, max: 90 }),
  validate,
];

const VALID_CATEGORIES = [
  'accident', 'crime', 'hazard', 'weather', 'fire',
  'medical', 'infrastructure', 'traffic', 'noise', 'other',
];

const AI_TAGS = {
  accident: ['collision', 'vehicle', 'emergency'],
  crime: ['theft', 'suspicious', 'police'],
  hazard: ['danger', 'obstacle', 'warning'],
  weather: ['storm', 'flood', 'ice'],
  fire: ['smoke', 'flames', 'evacuation'],
  medical: ['injury', 'ambulance', 'emergency'],
  infrastructure: ['road', 'utility', 'construction'],
  traffic: ['congestion', 'detour', 'delay'],
  noise: ['loud', 'disturbance'],
  other: ['alert', 'notice'],
};

const KEYWORD_TAGS = {
  gun: 'armed', knife: 'armed', weapon: 'armed',
  robbery: 'robbery', robbed: 'robbery', stolen: 'theft', steal: 'theft', stole: 'theft',
  assault: 'assault', attacked: 'assault', hit: 'violence',
  fire: 'fire', smoke: 'fire', flames: 'fire',
  flood: 'flood', water: 'flooding', rain: 'storm',
  crash: 'collision', collision: 'collision', wreck: 'collision',
  injury: 'injury', injured: 'injury', hurt: 'injury', bleeding: 'injury',
  suspicious: 'suspicious', stalking: 'suspicious',
  shooting: 'shooting', shots: 'shooting',
  explosion: 'explosion', bomb: 'explosion',
  pothole: 'road_hazard', sinkhole: 'road_hazard',
  drunk: 'intoxicated', drugs: 'narcotics',
  kid: 'child_safety', child: 'child_safety', children: 'child_safety',
  night: 'nighttime', dark: 'nighttime',
  ambulance: 'emergency', police: 'police', hospital: 'medical',
};

const simulateAITags = (category, description) => {
  const base = AI_TAGS[category] || ['alert'];
  const words = (description || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);

  // Extract keyword-based tags
  const contextual = [];
  words.forEach(w => {
    if (KEYWORD_TAGS[w] && !contextual.includes(KEYWORD_TAGS[w])) {
      contextual.push(KEYWORD_TAGS[w]);
    }
  });

  // Extract long meaningful words from description as potential tags
  const descriptive = words
    .filter(w => w.length > 5 && !['about', 'there', 'where', 'which', 'would', 'could', 'should', 'these', 'those', 'their', 'other', 'after', 'before', 'between', 'through', 'because', 'around'].includes(w))
    .slice(0, 2);

  return [...new Set([...base.slice(0, 2), ...contextual.slice(0, 3), ...descriptive])].slice(0, 6);
};

const createIncident = async (req, res) => {
  try {
    const { category, subcategory, title, description, severity, lng, lat, address, city, country, mediaUrls, mediaMeta } = req.body;

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Synchronous text validation to block gibberish and spam immediately
    const textValidation = await validateIncidentText(category, title, description);
    if (textValidation && textValidation.is_spam) {
      return res.status(400).json({ error: textValidation.reason || 'Your report contains gibberish or spam.' });
    }

    // Thumbnail from first media item
    const firstMedia = Array.isArray(mediaMeta) ? mediaMeta[0] : null;
    const thumbnail = firstMedia?.thumbnail || (mediaUrls?.[0] ? mediaUrls[0] : undefined);

    // Initial creation: fast and optimistic
    const incident = await Incident.create({
      userId: req.user?._id || null,
      category, subcategory, title, description,
      severity: parseInt(severity),
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      address, city, country,
      tags: simulateAITags(category, description),
      mediaUrls: mediaUrls || [],
      mediaMeta: mediaMeta || [],
      thumbnail,
      isFake: false,
      isActive: true,
    });

    if (req.user) {
      await User.addPoints(req.user._id, 10); // Reward optimistically
    }

    await cacheDelPattern('incidents:nearby:*');

    const populated = await incident.populate('userId', 'name avatarUrl trustScore');
    const plain = populated.toJSON();

    req.io?.emit('new_incident', plain);
    res.status(201).json({ incident: plain });

    // Background asynchronous AI verification
    (async () => {
      try {
        const aiResult = await verifyIncident({
          category,
          description,
          severity: parseInt(severity),
          mediaUrls: mediaUrls || [],
          timestamp: new Date(),
          location: { lng: parseFloat(lng), lat: parseFloat(lat) },
        }).catch(() => null);

        if (!aiResult) return;

        if (aiResult.is_fake) {
          // It was a fake! Revert and penalize.
          await Incident.findByIdAndUpdate(incident._id, { isFake: true, isActive: false });

          if (req.user) {
            // Deduct the optimistic +10 points AND slap a -20 point penalty
            await User.penalizeTrust(req.user._id, 20);
            await User.addPoints(req.user._id, -10);
          }

          await cacheDelPattern('incidents:nearby:*');
          // Tell active clients to ghost the incident off their maps
          req.io?.emit('update_incident', {
            id: incident._id,
            isActive: false,
            isFake: true,
            authorId: req.user ? req.user._id : null
          });
        } else {
          // It's genuine! Update with rich AI data.
          await Incident.findByIdAndUpdate(incident._id, {
            aiConfidence: aiResult.confidence_score,
            aiTags: aiResult.ai_tags,
            riskScore: aiResult.risk_score,
            riskLevel: aiResult.risk_level,
            isSensitive: aiResult.is_sensitive,
          });
          req.io?.emit('update_incident', {
            id: incident._id,
            aiTags: aiResult.ai_tags,
            riskLevel: aiResult.risk_level
          });
        }
      } catch (err) {
        console.error('Background AI Verification Error:', err);
      }
    })();
  } catch (err) {
    console.error('Create incident error:', err);
    res.status(500).json({ error: 'Failed to create incident' });
  }
};

const getNearby = async (req, res) => {
  try {
    const { lng, lat, radius = 10, category, severity, since } = req.query;
    if (!lng || !lat) return res.status(400).json({ error: 'lng and lat required' });

    const cacheKey = `incidents:nearby:${parseFloat(lng).toFixed(3)}:${parseFloat(lat).toFixed(3)}:${radius}:${category || ''}:${severity || ''}:${since || ''}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ incidents: cached, cached: true });

    const incidents = await Incident.findNearby({
      lng: parseFloat(lng),
      lat: parseFloat(lat),
      radiusKm: parseFloat(radius),
      category,
      severity: severity ? parseInt(severity) : undefined,
      since: since || undefined,
    });

    await cacheSet(cacheKey, incidents, 60);
    res.json({ incidents });
  } catch (err) {
    console.error('Get nearby error:', err);
    res.status(500).json({ error: 'Failed to get incidents' });
  }
};

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, severity, city } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (severity) filter.severity = { $gte: parseInt(severity) };
    if (city) filter.city = new RegExp(city, 'i');

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [incidents, total] = await Promise.all([
      Incident.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('userId', 'name').lean()
        .then((docs) => docs.map((d) => ({
          ...d,
          lng: d.location.coordinates[0],
          lat: d.location.coordinates[1],
          reporter_name: d.userId?.name || 'Anonymous',
        }))),
      Incident.countDocuments(filter),
    ]);

    res.json({ incidents, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get incidents' });
  }
};

const getById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).populate('userId', 'name avatarUrl');
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json({ incident });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get incident' });
  }
};

const voteIncident = async (req, res) => {
  try {
    const { voteType } = req.body;
    if (!['up', 'down'].includes(voteType)) return res.status(400).json({ error: 'voteType must be up or down' });

    const result = await Incident.vote(req.params.id, req.user._id, voteType);
    await cacheDelPattern('incidents:nearby:*');
    req.io?.emit('update_incident', { id: req.params.id, ...result });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to vote' });
  }
};

const deleteIncident = async (req, res) => {
  try {
    const result = await Incident.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!result) return res.status(404).json({ error: 'Incident not found or not yours' });
    await cacheDelPattern('incidents:nearby:*');
    req.io?.emit('update_incident', { id: req.params.id, isActive: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete incident' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { days = 7, city } = req.query;
    const cacheKey = `analytics:${days}:${city || ''}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const analytics = await Incident.getAnalytics({ days: parseInt(days), city });
    await cacheSet(cacheKey, analytics, 300);
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

const confirmIncident = async (req, res) => {
  try {
    const result = await Incident.confirm(req.params.id, req.user._id);
    await cacheDelPattern('incidents:nearby:*');
    req.io?.emit('update_incident', { id: req.params.id, confirmCount: result.confirmCount });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm incident' });
  }
};

module.exports = { createIncident, getNearby, getAll, getById, voteIncident, deleteIncident, getAnalytics, confirmIncident, createValidation };
