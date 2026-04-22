const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    name: { type: String, required: true, trim: true },
    avatarUrl: String,
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
    trustScore: { type: Number, default: 100, min: 0, max: 1000 },
    points: { type: Number, default: 0, min: 0 },
    badges: [{ id: String, label: String, icon: String, awardedAt: { type: Date, default: Date.now } }],
    isActive: { type: Boolean, default: true },
    lastLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
  },
  { timestamps: true, toJSON: { virtuals: true, transform: (_, obj) => { delete obj.passwordHash; delete obj.__v; return obj; } } }
);

userSchema.index({ lastLocation: '2dsphere' });
userSchema.index({ points: -1 });


userSchema.statics.createUser = async function ({ email, password, name }) {
  const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
  return this.create({ email, passwordHash, name });
};

userSchema.statics.verifyPassword = async function (plain, hash) {
  return bcrypt.compare(plain, hash);
};

userSchema.statics.addPoints = async function (userId, pts) {
  return this.findByIdAndUpdate(userId, { $inc: { points: pts } }, { new: true, select: 'points badges' });
};

userSchema.statics.getLeaderboard = function (limit = 20) {
  return this.find({ isActive: true })
    .sort({ points: -1 })
    .limit(limit)
    .select('name avatarUrl points trustScore badges');
};

const User = mongoose.model('User', userSchema);
module.exports = User;
