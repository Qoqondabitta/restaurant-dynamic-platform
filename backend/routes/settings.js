const express = require('express');
const router = express.Router();
const RestaurantSettings = require('../models/RestaurantSettings');

// GET /settings — return the single settings document (upsert if missing)
router.get('/', async (req, res) => {
  try {
    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = await RestaurantSettings.create({ languages: ['en'] });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /settings — update selected languages
router.put('/', async (req, res) => {
  try {
    const { languages } = req.body;
    if (!Array.isArray(languages) || languages.length === 0) {
      return res.status(400).json({ message: 'At least one language is required' });
    }
    const settings = await RestaurantSettings.findOneAndUpdate(
      {},
      { languages },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
