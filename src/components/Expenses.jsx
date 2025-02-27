import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  InputAdornment,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date(),
  });
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (!Array.isArray(expenses)) return;
    const uniqueCategories = [...new Set(expenses.map(exp => exp.category).filter(Boolean))];
    setCategories(['all', ...uniqueCategories]);
  }, [expenses]);

  useEffect(() => {
    if (!Array.isArray(expenses)) return;
    setFilteredExpenses(applyFilters(expenses));
  }, [expenses, selectedCategory, dateRange, amountRange]);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const expensesData = Array.isArray(response.data) ? response.data : 
                          Array.isArray(response.data.data) ? response.data.data : [];
      setExpenses(expensesData);
    } catch (err) {
      setError('Error fetching expenses');
      setSnackbarOpen(true);
    }
  };

  const handleInputChange = (e) => {
    setNewExpense({
      ...newExpense,
      [e.target.name]: e.target.value
    });
  };

  const handleDateChange = (date) => {
    setNewExpense((prev) => ({
      ...prev,
      date: date
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const amount = parseFloat(newExpense.amount);
      
      if (isNaN(amount)) {
        setError('Please enter a valid amount');
        setSnackbarOpen(true);
        return;
      }

      const expenseData = {
        description: newExpense.description,
        amount: amount,
        category: newExpense.category.trim() || 'Uncategorized',
        date: new Date(newExpense.date).toISOString()
      };

      if (selectedExpense) {
        await axios.put(
          `http://localhost:3001/api/expenses/${selectedExpense._id}`,
          expenseData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post('http://localhost:3001/api/expenses', expenseData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      fetchExpenses();
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(selectedExpense ? 'Error updating expense' : 'Error creating expense');
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchExpenses();
      setDeleteConfirmOpen(false);
    } catch (err) {
      setError('Error deleting expense');
      setSnackbarOpen(true);
    }
  };

  const resetForm = () => {
    setNewExpense({
      description: '',
      amount: '',
      category: '',
      date: new Date(),
    });
    setSelectedExpense(null);
  };

  const applyFilters = (expenses) => {
    if (!Array.isArray(expenses)) return [];
    return expenses.filter(expense => {
      const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
      const matchesDateRange = (!dateRange.start || new Date(expense.date) >= new Date(dateRange.start)) &&
        (!dateRange.end || new Date(expense.date) <= new Date(dateRange.end));
      
      const expAmount = parseFloat(expense.amount);
      const minAmount = amountRange.min ? parseFloat(amountRange.min) : null;
      const maxAmount = amountRange.max ? parseFloat(amountRange.max) : null;
      
      const matchesAmountRange = 
        (!minAmount || (expAmount && !isNaN(expAmount) && expAmount >= minAmount)) &&
        (!maxAmount || (expAmount && !isNaN(expAmount) && expAmount <= maxAmount));
      
      return matchesCategory && matchesDateRange && matchesAmountRange;
    });
  };

  const columns = [
    { field: 'description', headerName: 'Description', flex: 1 },
    { 
      field: 'amount', 
      headerName: 'Amount', 
      flex: 1,
      valueFormatter: (params) => {
        const amount = parseFloat(params.value);
        return `₹${isNaN(amount) ? '0.00' : amount.toFixed(2)}`;
      }
    },
    { field: 'category', headerName: 'Category', flex: 1 },
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      valueFormatter: (params) => {
        try {
          const date = new Date(params.value);
          return date instanceof Date && !isNaN(date) 
            ? date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : 'Invalid Date';
        } catch (error) {
          return 'Invalid Date';
        }
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedExpense(params.row);
              setNewExpense({
                description: params.row.description,
                amount: params.row.amount.toString(),
                category: params.row.category,
                date: new Date(params.row.date),
              });
              setDialogOpen(true);
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedExpense(params.row);
              setDeleteConfirmOpen(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">Expenses</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Start Date"
                type="date"
                size="small"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Date"
                type="date"
                size="small"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Min Amount"
                type="number"
                size="small"
                value={amountRange.min}
                onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
              />
              <TextField
                label="Max Amount"
                type="number"
                size="small"
                value={amountRange.max}
                onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
              />
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : 
                      (category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Uncategorized')}
                  </MenuItem>
                ))}
              </Select>
              <Button
                variant="contained"
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              >
                Add Expense
              </Button>
            </Box>
          </Box>

          <Box sx={{ height: 600 }}>
            <DataGrid
              rows={filteredExpenses.map(expense => ({
                ...expense,
                id: expense._id
              }))}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10]}
              getRowId={(row) => row._id || row.id}
              disableSelectionOnClick
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedExpense ? 'Edit Expense' : 'Add New Expense'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={newExpense.description}
              onChange={handleInputChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Amount"
              name="amount"
              type="number"
              value={newExpense.amount}
              onChange={handleInputChange}
              required
              margin="normal"
              inputProps={{
                min: "0",
                step: "0.01"
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Category"
              name="category"
              value={newExpense.category}
              onChange={handleInputChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Date"
              name="date"
              type="date"
              value={newExpense.date instanceof Date ? newExpense.date.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateChange(new Date(e.target.value))}
              required
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogOpen(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedExpense ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this expense?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleDelete(selectedExpense?._id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Expenses; 