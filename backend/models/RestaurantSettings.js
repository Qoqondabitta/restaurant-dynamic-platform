const mongoose = require('mongoose');

const restaurantSettingsSchema = new mongoose.Schema(
  {
    languages: {
      type: [String],
      default: ['en'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 1,
        message: 'At least one language must be selected',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RestaurantSettings', restaurantSettingsSchema);
