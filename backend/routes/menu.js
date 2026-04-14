const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const upload = require('../middleware/upload');

// GET /menu — fetch all items, sorted by category
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ category: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /menu — add a new item (multipart/form-data or imageUrl in body)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title: titleJson, ingredients: ingredientsJson, price, currency, category, imageUrl } = req.body;

    const titleObj      = JSON.parse(titleJson      || '{}');
    const ingredientsObj = JSON.parse(ingredientsJson || '{}');

    if (!titleObj.en) {
      return res.status(400).json({ message: 'English title (en) is required' });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : imageUrl;
    if (!image) {
      return res.status(400).json({ message: 'An image file or imageUrl is required' });
    }

    const item = new MenuItem({
      title: titleObj,
      price: parseFloat(price),
      currency: currency || 'USD',
      category,
      ingredients: ingredientsObj,
      image,
    });

    const saved = await item.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /menu/:id — update an item
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { title: titleJson, ingredients: ingredientsJson, price, currency, category, imageUrl } = req.body;

    const titleObj      = JSON.parse(titleJson      || '{}');
    const ingredientsObj = JSON.parse(ingredientsJson || '{}');

    if (!titleObj.en) {
      return res.status(400).json({ message: 'English title (en) is required' });
    }

    const update = {
      title: titleObj,
      price: parseFloat(price),
      currency: currency || 'USD',
      category,
      ingredients: ingredientsObj,
    };

    if (req.file) {
      update.image = `/uploads/${req.file.filename}`;
    } else if (imageUrl) {
      update.image = imageUrl;
    }

    const item = await MenuItem.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /menu/:id — remove an item
router.delete('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
