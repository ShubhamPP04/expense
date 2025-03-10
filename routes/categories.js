const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Category = require('../models/Category');

// Get all categories
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user.id });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new category
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    const newCategory = new Category({
      name,
      user: req.user.id
    });

    const category = await newCategory.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a category
router.put('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    category.name = name;
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a category
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await category.remove();
    res.json({ message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;