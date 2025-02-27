const router = require('express').Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

// Validation middleware
const validateExpenseInput = [
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 3, max: 100 }).withMessage('Description must be between 3 and 100 characters'),
  body('amount')
    .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  body('date')
    .isISO8601().withMessage('Invalid date format')
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  next();
};

// Get all expenses for a user
router.get('/', auth, async (req, res) => {
  try {
    const { category, startDate, endDate, sort = 'desc' } = req.query;
    let query = { user: req.user.userId };
    
    // Apply filters
    if (category) {
      query.category = category;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .sort({ date: sort === 'desc' ? -1 : 1 });
      
    res.json({
      status: 'success',
      data: expenses
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching expenses',
      error: error.message
    });
  }
});

// Get single expense detail
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid expense ID')
], handleValidationErrors, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!expense) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found'
      });
    }

    res.json({
      status: 'success',
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching expense details',
      error: error.message
    });
  }
});

// Create a new expense
router.post('/', auth, validateExpenseInput, handleValidationErrors, async (req, res) => {
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
    req.app.get('io').emit('expenseCreated', savedExpense);
    
    res.status(201).json({
      status: 'success',
      message: 'Expense created successfully',
      data: savedExpense
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error creating expense',
      error: error.message
    });
  }
});

// Update an expense
router.put('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid expense ID'),
  ...validateExpenseInput
], handleValidationErrors, async (req, res) => {
  try {
    const { description, amount, category, date } = req.body;
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { description, amount, category, date: new Date(date) },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found'
      });
    }

    req.app.get('io').emit('expenseUpdated', expense);
    
    res.json({
      status: 'success',
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error updating expense',
      error: error.message
    });
  }
});

// Delete an expense
router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid expense ID')
], handleValidationErrors, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!expense) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found'
      });
    }

    req.app.get('io').emit('expenseDeleted', req.params.id);
    
    res.json({
      status: 'success',
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error deleting expense',
      error: error.message
    });
  }
});

// Delete multiple expenses
router.delete('/batch/delete', auth, [
  body('ids').isArray().withMessage('IDs must be an array'),
  body('ids.*').isMongoId().withMessage('Invalid expense ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { ids } = req.body;
    
    const result = await Expense.deleteMany({
      _id: { $in: ids },
      user: req.user.userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No expenses found to delete'
      });
    }

    // Emit deletion event for each ID
    ids.forEach(id => {
      req.app.get('io').emit('expenseDeleted', id);
    });
    
    res.json({
      status: 'success',
      message: `Successfully deleted ${result.deletedCount} expenses`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error deleting expenses',
      error: error.message
    });
  }
});

module.exports = router;