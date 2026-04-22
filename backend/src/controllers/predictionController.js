const { getPrediction } = require('../services/prediction.service');
const { getZoneRisk } = require('../services/dataFusion.service');
const { assessSafety } = require('../services/aiVerification.service');
const Incident = require('../models/incident');

const getRiskPrediction = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const prediction = await getPrediction({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radiusKm: parseFloat(radius),
    });

    res.json(prediction);
  } catch (err) {
    console.error('Prediction error:', err);
    res.status(500).json({ error: 'Prediction failed' });
  }
};

const getZoneAnalysis = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    // Get recent incidents in area
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const incidents = await Incident.find({
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parsedLng, parsedLat] },
          $maxDistance: 5000,
        },
      },
      createdAt: { $gte: since },
    }).select('severity').lean();

    const avgSeverity = incidents.length
      ? incidents.reduce((s, i) => s + i.severity, 0) / incidents.length
      : 2;

    const zoneRisk = await getZoneRisk({
      lat: parsedLat,
      lng: parsedLng,
      recentIncidentCount: incidents.length,
      avgSeverity,
    });

    res.json(zoneRisk);
  } catch (err) {
    console.error('Zone analysis error:', err);
    res.status(500).json({ error: 'Zone analysis failed' });
  }
};

const askAiAssistant = async (req, res) => {
  try {
    const { question, lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentIncidents = await Incident.find({
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parsedLng, parsedLat] },
          $maxDistance: 3000,
        },
      },
      createdAt: { $gte: since },
    }).select('severity category title').lean();

    const assessment = await assessSafety({ question, lat: parsedLat, lng: parsedLng, recentIncidents });
    res.json(assessment);
  } catch (err) {
    console.error('AI assistant error:', err);
    res.status(500).json({ error: 'AI assessment failed' });
  }
};

module.exports = { getRiskPrediction, getZoneAnalysis, askAiAssistant };
