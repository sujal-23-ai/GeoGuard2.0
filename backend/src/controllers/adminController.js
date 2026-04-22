const Incident = require('../models/incident');
const User = require('../models/user');

const getIncidents = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, severity, active } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (severity) filter.severity = { $gte: parseInt(severity) };
    if (active !== undefined) filter.isActive = active === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [incidents, total] = await Promise.all([
      Incident.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('userId', 'name email')
        .lean()
        .then((docs) => docs.map((d) => ({
          ...d,
          lng: d.location?.coordinates?.[0],
          lat: d.location?.coordinates?.[1],
          reporter_name: d.userId?.name || 'Anonymous',
          reporter_email: d.userId?.email || null,
        }))),
      Incident.countDocuments(filter),
    ]);
    res.json({ incidents, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get incidents' });
  }
};

const verifyIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    req.io?.emit('update_incident', { id: incident._id, isVerified: true });
    res.json({ incident });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify incident' });
  }
};

const toggleIncidentActive = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    incident.isActive = !incident.isActive;
    await incident.save();
    req.io?.emit('update_incident', { id: incident._id, isActive: incident.isActive });
    res.json({ id: incident._id, isActive: incident.isActive });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update incident' });
  }
};

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .select('name email role trustScore points isActive createdAt badges'),
      User.countDocuments(filter),
    ]);
    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get users' });
  }
};

const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot deactivate yourself' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ id: user._id, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const setUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
      .select('name email role');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

const getStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalIncidents, activeIncidents, verifiedIncidents] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Incident.countDocuments(),
      Incident.countDocuments({ isActive: true }),
      Incident.countDocuments({ isVerified: true }),
    ]);
    res.json({ totalUsers, activeUsers, totalIncidents, activeIncidents, verifiedIncidents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

module.exports = { getIncidents, verifyIncident, toggleIncidentActive, getUsers, toggleUserActive, setUserRole, getStats };
