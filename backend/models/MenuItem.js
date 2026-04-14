const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    title: { type: Map, of: String, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'RUB', 'UZS', 'PLN'],
      default: 'USD',
    },
    category: {
      type: String,
      required: true,
      enum: ['Drinks', 'Main Dishes', 'Salads', 'Soups', 'Desserts'],
    },
    ingredients: { type: Map, of: String, required: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
