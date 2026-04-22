const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
    message: String,
    isResolved: { type: Boolean, default: false },
    resolvedAt: Date,
  },
  { timestamps: true }
);

sosAlertSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SosAlert', sosAlertSchema);
