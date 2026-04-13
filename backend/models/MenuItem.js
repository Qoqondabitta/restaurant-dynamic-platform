const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ['Drinks', 'Main Dishes', 'Salads', 'Soups', 'Desserts'],
    },
    ingredients: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    discount: {
      percentage: { type: Number, min: 0, max: 100, default: 0 },
      isActive: { type: Boolean, default: false },
      startTime: { type: Date },
      endTime: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
