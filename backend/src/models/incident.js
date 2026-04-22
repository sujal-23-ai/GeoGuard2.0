const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    category: { type: String, required: true, index: true },
    subcategory: String,
    title: { type: String, required: true, trim: true, maxlength: 255 },
    description: { type: String, trim: true },
    severity: { type: Number, required: true, min: 1, max: 5, default: 3 },
    location: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
      coordinates: { type: [Number], required: true },  // [lng, lat]
    },
    address: String,
    city: String,
    country: String,
    // Media (Cloudinary URLs)
    mediaUrls: [String],
    mediaMeta: [{
      url: String,
      thumbnail: String,
      lowRes: String,
      type: { type: String, enum: ['image', 'video'], default: 'image' },
      isSensitive: { type: Boolean, default: false },
    }],
    thumbnail: String,
    tags: [String],
    // AI verification fields
    aiConfidence: { type: Number, min: 0, max: 1, default: null },
    aiTags: [String],
    riskScore: { type: Number, min: 0, max: 1, default: null },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    isSensitive: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0, min: 0 },
    downvotes: { type: Number, default: 0, min: 0 },
    voters: [{ userId: mongoose.Schema.Types.ObjectId, voteType: { type: String, enum: ['up', 'down'] } }],
    confirmCount: { type: Number, default: 0 },
    confirmedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 72 * 60 * 60 * 1000) },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, obj) => {
        obj.lng = obj.location?.coordinates?.[0];
        obj.lat = obj.location?.coordinates?.[1];
        delete obj.__v;
        return obj;
      },
    },
  }
);

incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ severity: -1 });
incidentSchema.index({ city: 1 });
incidentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

incidentSchema.statics.findNearby = async function ({ lng, lat, radiusKm = 10, category, severity, since, limit = 50 }) {
  const filter = {
    isActive: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000,
      },
    },
  };

  if (category) filter.category = category;
  if (severity) filter.severity = { $gte: severity };
  if (since) filter.createdAt = { $gte: new Date(since) };

  return this.find(filter)
    .limit(limit)
    .populate('userId', 'name avatarUrl trustScore')
    .sort({ createdAt: -1 })
    .lean()
    .then((docs) =>
      docs.map((d) => ({
        ...d,
        lng: d.location.coordinates[0],
        lat: d.location.coordinates[1],
        reporter_name: d.userId?.name || 'Anonymous',
        reporter_avatar: d.userId?.avatarUrl || null,
        reporter_trust: d.userId?.trustScore || null,
      }))
    );
};

incidentSchema.statics.vote = async function (incidentId, userId, voteType) {
  const incident = await this.findById(incidentId);
  if (!incident) throw new Error('Incident not found');

  const idx = incident.voters.findIndex((v) => v.userId.toString() === userId.toString());

  if (idx !== -1) {
    const existing = incident.voters[idx].voteType;
    if (existing === voteType) {
      // undo vote
      incident.voters.splice(idx, 1);
      if (voteType === 'up') incident.upvotes = Math.max(0, incident.upvotes - 1);
      else incident.downvotes = Math.max(0, incident.downvotes - 1);
    } else {
      // switch vote
      incident.voters[idx].voteType = voteType;
      if (voteType === 'up') { incident.upvotes++; incident.downvotes = Math.max(0, incident.downvotes - 1); }
      else { incident.downvotes++; incident.upvotes = Math.max(0, incident.upvotes - 1); }
    }
  } else {
    incident.voters.push({ userId, voteType });
    if (voteType === 'up') incident.upvotes++;
    else incident.downvotes++;
  }

  await incident.save();
  return { upvotes: incident.upvotes, downvotes: incident.downvotes };
};

incidentSchema.statics.confirm = async function (incidentId, userId) {
  const incident = await this.findById(incidentId);
  if (!incident) throw new Error('Incident not found');

  const alreadyConfirmed = incident.confirmedBy.some((id) => id.toString() === userId.toString());
  if (alreadyConfirmed) return { confirmCount: incident.confirmCount, alreadyConfirmed: true };

  incident.confirmedBy.push(userId);
  incident.confirmCount = incident.confirmedBy.length;
  await incident.save();
  return { confirmCount: incident.confirmCount, alreadyConfirmed: false };
};

incidentSchema.statics.getAnalytics = async function ({ days = 7, city } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const match = { createdAt: { $gte: since } };
  if (city) match.city = new RegExp(city, 'i');

  const [byCategory, bySeverity, byHour, totalRes] = await Promise.all([
    this.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    this.aggregate([{ $match: match }, { $group: { _id: '$severity', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    this.aggregate([
      { $match: match },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
    ]),
    this.countDocuments(match),
  ]);

  return {
    byCategory: byCategory.map((d) => ({ category: d._id, count: d.count })),
    bySeverity: bySeverity.map((d) => ({ severity: d._id, count: d.count })),
    byHour: byHour.map((d) => ({ hour: d._id, count: d.count })),
    total: totalRes,
  };
};

const Incident = mongoose.model('Incident', incidentSchema);
module.exports = Incident;
