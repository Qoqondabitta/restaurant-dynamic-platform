const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    title: { type: Map, of: String, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'CNY', 'AED', 'SAR', 'TRY', 'RUB', 'UZS', 'PLN'],
      default: 'USD',
    },
    category: {
      type: String,
      required: true,
    },
    ingredients: { type: Map, of: String, required: true },
    image: { type: String, required: true },
    discount: {
      percentage: { type: Number, default: 0, min: 0, max: 100 },
      isActive:   { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
