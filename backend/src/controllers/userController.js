const crypto = require('crypto');
const User = require('../models/user');
const Incident = require('../models/incident');
const SosAlert = require('../models/sosAlert');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');
const sendSosSms = require('../send_sms/sms');

const SHARE_TTL = 1800; // 30 minutes

const getProfile = async (req, res) => {
  try {
    const targetId = req.params.id || req.user._id;
    const user = await User.findById(targetId).where({ isActive: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const incidentCount = await Incident.countDocuments({ userId: user._id, isActive: true });
    res.json({ user: { ...user.toJSON(), incidentCount } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatarUrl) updates.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lng, lat } = req.body;
    if (!lng || !lat) return res.status(400).json({ error: 'lng and lat required' });

    await User.findByIdAndUpdate(req.user._id, {
      lastLocation: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update location' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const leaders = await User.getLeaderboard(20);
    res.json({ leaders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .select('email name role trustScore points isActive createdAt'),
      User.countDocuments(),
    ]);
    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get users' });
  }
};

const sosAlert = async (req, res) => {
  try {
    let { lng, lat, longitude, latitude, message, name } = req.body;
    
    // Support alternative field names
    if (!lng && longitude) lng = longitude;
    if (!lat && latitude) lat = latitude;
    
    if (!lng || !lat) return res.status(400).json({ error: 'Location required' });

    const alert = await SosAlert.create({
      userId: req.user._id,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      message: message || null,
    });

    req.io?.emit('sos_alert', {
      id: alert._id,
      userId: req.user._id,
      userName: name || req.user.name,
      lng: parseFloat(lng),
      lat: parseFloat(lat),
      message,
      createdAt: alert.createdAt,
    });

    // Fire SMS to emergency contacts (non-blocking)
    const { username, emergency_contacts } = req.body;
    if (emergency_contacts && emergency_contacts.length > 0) {
      sendSosSms({
        username: username || name || req.user.name,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        emergency_contacts,
      }).catch(err => console.error('SOS SMS dispatch error:', err));
    }

    res.status(201).json({ alert });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send SOS' });
  }
};

const createShareSession = async (req, res) => {
  try {
    const { lat, lng, message } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SHARE_TTL * 1000).toISOString();
    const session = {
      userId: req.user._id.toString(),
      name: req.user.name,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      message: message || null,
      createdAt: new Date().toISOString(),
      expiresAt,
      updatedAt: new Date().toISOString(),
    };

    await cacheSet(`share:${token}`, session, SHARE_TTL);
    const base = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.status(201).json({ token, expiresAt, shareUrl: `${base}?shareToken=${token}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create share session' });
  }
};

const getShareSession = async (req, res) => {
  try {
    const session = await cacheGet(`share:${req.params.token}`);
    if (!session) return res.status(404).json({ error: 'Share session not found or expired' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get share session' });
  }
};

const updateSharePosition = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const session = await cacheGet(`share:${req.params.token}`);
    if (!session) return res.status(404).json({ error: 'Share session not found or expired' });
    if (session.userId !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });

    const remaining = Math.ceil((new Date(session.expiresAt) - Date.now()) / 1000);
    if (remaining <= 0) return res.status(410).json({ error: 'Share session expired' });

    const updated = { ...session, lat: parseFloat(lat), lng: parseFloat(lng), updatedAt: new Date().toISOString() };
    await cacheSet(`share:${req.params.token}`, updated, remaining);

    req.io?.to(`share:${req.params.token}`).emit('share_update', {
      token: req.params.token,
      lat: updated.lat,
      lng: updated.lng,
      name: updated.name,
      updatedAt: updated.updatedAt,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update position' });
  }
};

const stopShareSession = async (req, res) => {
  try {
    const session = await cacheGet(`share:${req.params.token}`);
    if (!session) return res.status(404).json({ error: 'Share session not found' });
    if (session.userId !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });

    await cacheDel(`share:${req.params.token}`);
    req.io?.to(`share:${req.params.token}`).emit('share_ended', { token: req.params.token });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to stop share session' });
  }
};

module.exports = {
  getProfile, updateProfile, updateLocation, getLeaderboard, getAllUsers, sosAlert,
  createShareSession, getShareSession, updateSharePosition, stopShareSession,
};
