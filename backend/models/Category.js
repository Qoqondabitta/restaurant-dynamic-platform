const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: Map,
      of: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Require English name before saving
categorySchema.pre('save', function (next) {
  if (!this.name.get('en') || !this.name.get('en').trim()) {
    return next(new Error('English category name (name.en) is required'));
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
