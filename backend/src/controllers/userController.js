const User = require('../models/user');
const Incident = require('../models/incident');
const SosAlert = require('../models/sosAlert');

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
    const { lng, lat, message } = req.body;
    if (!lng || !lat) return res.status(400).json({ error: 'Location required' });

    const alert = await SosAlert.create({
      userId: req.user._id,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      message: message || null,
    });

    req.io?.emit('sos_alert', {
      id: alert._id,
      userId: req.user._id,
      userName: req.user.name,
      lng: parseFloat(lng),
      lat: parseFloat(lat),
      message,
      createdAt: alert.createdAt,
    });

    res.status(201).json({ alert });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send SOS' });
  }
};

module.exports = { getProfile, updateProfile, updateLocation, getLeaderboard, getAllUsers, sosAlert };
