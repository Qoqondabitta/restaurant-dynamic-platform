const express = require('express');
const router = express.Router();
const Discount = require('../models/Discount');

// GET /discounts
router.get('/', async (req, res) => {
  try {
    const discounts = await Discount.find().sort({ createdAt: -1 });
    res.json(discounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /discounts
router.post('/', async (req, res) => {
  try {
    const { title, percentage, appliesTo, startTime, endTime, isActive } = req.body;
    const discount = new Discount({
      title,
      percentage: parseFloat(percentage),
      appliesTo: appliesTo || 'Everyone',
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      isActive: isActive !== undefined ? isActive : true,
    });
    const saved = await discount.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /discounts/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, percentage, appliesTo, startTime, endTime, isActive } = req.body;
    const update = {
      title,
      percentage: parseFloat(percentage),
      appliesTo: appliesTo || 'Everyone',
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      isActive,
    };
    const discount = await Discount.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!discount) return res.status(404).json({ message: 'Discount not found' });
    res.json(discount);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /discounts/:id
router.delete('/:id', async (req, res) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) return res.status(404).json({ message: 'Discount not found' });
    res.json({ message: 'Deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
