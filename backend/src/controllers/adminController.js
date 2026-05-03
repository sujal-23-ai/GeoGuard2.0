const Incident = require('../models/incident');
const User = require('../models/user');
const SosAlert = require('../models/sosAlert');

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

const deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    req.io?.emit('update_incident', { id: req.params.id, isActive: false, deleted: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete incident' });
  }
};

const getSosAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20, resolved } = req.query;
    const filter = {};
    if (resolved !== undefined) filter.isResolved = resolved === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [alerts, total] = await Promise.all([
      SosAlert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('userId', 'name email')
        .lean()
        .then(docs => docs.map(d => ({
          ...d,
          lng: d.location?.coordinates?.[0],
          lat: d.location?.coordinates?.[1],
          userName: d.userId?.name || 'Unknown',
          userEmail: d.userId?.email || null,
        }))),
      SosAlert.countDocuments(filter),
    ]);
    res.json({ alerts, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get SOS alerts' });
  }
};

const resolveSosAlert = async (req, res) => {
  try {
    const alert = await SosAlert.findByIdAndUpdate(
      req.params.id,
      { isResolved: true, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'SOS alert not found' });
    res.json({ alert });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve SOS alert' });
  }
};

const updateUserTrust = async (req, res) => {
  try {
    const { trustScore } = req.body;
    if (trustScore === undefined || trustScore < 0 || trustScore > 1000) {
      return res.status(400).json({ error: 'trustScore must be between 0 and 1000' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { trustScore }, { new: true })
      .select('name email role trustScore points');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update trust score' });
  }
};

const getStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalUsers, activeUsers, totalIncidents, activeIncidents, verifiedIncidents,
           totalSos, unresolvedSos, bannedUsers, recentIncidents, categoryBreakdown] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Incident.countDocuments(),
      Incident.countDocuments({ isActive: true }),
      Incident.countDocuments({ isVerified: true }),
      SosAlert.countDocuments(),
      SosAlert.countDocuments({ isResolved: false }),
      User.countDocuments({ isActive: false }),
      Incident.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Incident.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);
    res.json({
      totalUsers, activeUsers, totalIncidents, activeIncidents, verifiedIncidents,
      totalSos, unresolvedSos, bannedUsers, recentIncidents,
      categoryBreakdown: categoryBreakdown.map(d => ({ category: d._id, count: d.count })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

module.exports = {
  getIncidents, verifyIncident, toggleIncidentActive, deleteIncident,
  getUsers, toggleUserActive, setUserRole, updateUserTrust,
  getSosAlerts, resolveSosAlert,
  getStats,
};
