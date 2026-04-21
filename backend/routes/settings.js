const express = require('express');
const router = express.Router();
const RestaurantSettings = require('../models/RestaurantSettings');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');

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

// PUT /settings — save languages (always succeeds) + return non-blocking warnings
router.put('/', async (req, res) => {
  try {
    const { languages } = req.body;
    if (!Array.isArray(languages) || languages.length === 0) {
      return res.status(400).json({ message: 'At least one language is required' });
    }

    // Deduplicate and always ensure 'en' is represented
    const unique = [...new Set(languages)];

    // Save languages — never blocked
    const settings = await RestaurantSettings.findOneAndUpdate(
      {},
      { languages: unique },
      { upsert: true, new: true, runValidators: true }
    );

    // Non-blocking validation: detect items missing translations
    const items = await MenuItem.find();
    const missingTranslations = [];

    for (const item of items) {
      const missing = [];
      for (const lang of unique) {
        if (!item.title.get(lang)) missing.push(`title.${lang}`);
        if (!item.ingredients.get(lang)) missing.push(`ingredients.${lang}`);
      }
      if (missing.length > 0) {
        missingTranslations.push({
          itemId: item._id,
          itemName: item.title.get('en') || Object.values(Object.fromEntries(item.title))[0] || 'Unknown',
          missing,
        });
      }
    }

    // Non-blocking validation: detect categories missing translations
    const categories = await Category.find();
    const missingCategoryTranslations = [];

    for (const cat of categories) {
      const missing = [];
      for (const lang of unique) {
        if (!cat.name.get(lang)) missing.push(`name.${lang}`);
      }
      if (missing.length > 0) {
        missingCategoryTranslations.push({
          categoryId: cat._id,
          categoryName: cat.name.get('en') || 'Unknown',
          missing,
        });
      }
    }

    const hasWarning = missingTranslations.length > 0 || missingCategoryTranslations.length > 0;
    if (hasWarning) {
      return res.json({
        success: true,
        warning: true,
        missingTranslations,
        missingCategoryTranslations,
        languages: settings.languages,
      });
    }

    res.json({ success: true, warning: false, languages: settings.languages });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
