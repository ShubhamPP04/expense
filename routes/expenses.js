const router = require('express').Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

// Get all expenses for a user
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.userId })
      .sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses', error: error.message });
  }
});

// Create a new expense
router.post('/', auth, async (req, res) => {
  try {
    const { description, amount, category, date } = req.body;
    const expense = new Expense({
      description,
      amount,
      category,
      date: new Date(date),
      user: req.user.userId
    });

    const savedExpense = await expense.save();
    // Emit real-time update
    req.app.get('io').emit('expenseCreated', savedExpense);
    
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error creating expense', error: error.message });
  }
});

// Update an expense
router.put('/:id', auth, async (req, res) => {
  try {
    const { description, amount, category, date } = req.body;
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { description, amount, category, date: new Date(date) },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Emit real-time update
    req.app.get('io').emit('expenseUpdated', expense);
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense', error: error.message });
  }
});

// Delete an expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Emit real-time update
    req.app.get('io').emit('expenseDeleted', req.params.id);
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense', error: error.message });
  }
});

module.exports = router;