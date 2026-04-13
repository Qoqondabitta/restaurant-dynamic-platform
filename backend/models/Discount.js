const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    appliesTo: { type: String, default: 'Everyone', trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Discount', discountSchema);
