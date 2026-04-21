const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

const DEFAULT_CATEGORIES = [
  { en: 'Drinks',      ru: 'Напитки',         uz: 'Ichimliklar' },
  { en: 'Main Dishes', ru: 'Основные блюда',   uz: 'Asosiy taomlar' },
  { en: 'Salads',      ru: 'Салаты',           uz: 'Salatlar' },
  { en: 'Soups',       ru: 'Супы',             uz: "Sho'rvalar" },
  { en: 'Desserts',    ru: 'Десерты',          uz: 'Desertlar' },
];

// GET /categories — return all; seed defaults if empty
router.get('/', async (req, res) => {
  try {
    let cats = await Category.find().sort({ createdAt: 1 });
    if (cats.length === 0) {
      cats = await Category.insertMany(
        DEFAULT_CATEGORIES.map((names) => ({ name: names }))
      );
    }
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /categories — create new category (requires name.en, no duplicates)
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.en || !String(name.en).trim()) {
      return res.status(400).json({ message: 'English category name is required' });
    }
    // Duplicate check (case-insensitive English name)
    const existing = await Category.findOne();
    const all = await Category.find();
    const duplicate = all.find(
      (c) => c.name.get('en')?.toLowerCase() === name.en.toLowerCase()
    );
    if (duplicate) {
      return res.status(409).json({ message: `Category "${name.en}" already exists` });
    }
    const cat = new Category({ name });
    await cat.save();
    res.status(201).json(cat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /categories/:id — update translations (name map)
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.en || !String(name.en).trim()) {
      return res.status(400).json({ message: 'English category name is required' });
    }
    // Check duplicate English name excluding self
    const all = await Category.find({ _id: { $ne: req.params.id } });
    const duplicate = all.find(
      (c) => c.name.get('en')?.toLowerCase() === name.en.toLowerCase()
    );
    if (duplicate) {
      return res.status(409).json({ message: `Category "${name.en}" already exists` });
    }
    const cat = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: false }
    );
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    res.json(cat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /categories/:id — blocked if any items use this category
router.delete('/:id', async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    const englishName = cat.name.get('en');
    const itemCount = await MenuItem.countDocuments({ category: englishName });
    if (itemCount > 0) {
      return res.status(409).json({
        message: `Cannot delete: ${itemCount} menu item${itemCount > 1 ? 's' : ''} use this category`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
