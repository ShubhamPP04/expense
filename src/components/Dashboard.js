import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  createTheme
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AttachMoney,
  Category,
  Settings,
  Logout,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Brightness4,
  Brightness7
} from '@mui/icons-material';
import { format as dateFnsFormat } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const drawerWidth = 240;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Dashboard = ({ isDarkMode, setIsDarkMode }) => {
  const theme = useTheme();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date(),
  });
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const socket = io('http://localhost:3001');
    socket.on('expenseCreated', (expense) => {
      setExpenses(prev => [expense, ...prev]);
    });
    socket.on('expenseUpdated', (updatedExpense) => {
      setExpenses(prev => prev.map(exp => 
        exp._id === updatedExpense._id ? updatedExpense : exp
      ));
    });
    socket.on('expenseDeleted', (expenseId) => {
      setExpenses(prev => prev.filter(exp => exp._id !== expenseId));
    });

    fetchExpenses();
    return () => socket.disconnect();
  }, [navigate]);

  useEffect(() => {
    if (!Array.isArray(expenses)) return;
    
    const uniqueCategories = [...new Set(expenses.map(exp => exp.category).filter(Boolean))];
    setCategories(['all', ...uniqueCategories]);
  }, [expenses]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredExpenses(expenses);
    } else {
      setFilteredExpenses(expenses.filter(exp => exp.category === selectedCategory));
    }
  }, [expenses, selectedCategory]);

  useEffect(() => {
    if (!Array.isArray(expenses)) return;
    setFilteredExpenses(applyFilters(expenses));
  }, [expenses, selectedCategory, dateRange, amountRange]);

  useEffect(() => {
    console.log('expenses:', expenses, 'type:', typeof expenses, 'isArray:', Array.isArray(expenses));
  }, [expenses]);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ensure we're getting the correct data structure
      const expensesData = Array.isArray(response.data) ? response.data : 
                          Array.isArray(response.data.data) ? response.data.data : [];
      setExpenses(expensesData);
    } catch (err) {
      setError('Error fetching expenses');
      setSnackbarOpen(true);
      setExpenses([]);
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
      
      // Validate amount
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

      console.log('Sending expense data:', expenseData); // Debug log

      const response = await axios.post('http://localhost:3001/api/expenses', expenseData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Extract and format the expense data from the response
      const responseData = response.data.data || response.data;
      const newExpenseData = {
        ...responseData,
        amount: parseFloat(responseData.amount),
        date: new Date(responseData.date).toISOString()
      };

      console.log('Received expense data:', newExpenseData); // Debug log

      // Update the expenses state with the new expense data
      setExpenses(prev => Array.isArray(prev) ? [newExpenseData, ...prev] : [newExpenseData]);
      
      // Reset form
      setNewExpense({
        description: '',
        amount: '',
        category: '',
        date: new Date(),
      });
      setAddExpenseDialogOpen(false);
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Error creating expense');
      setSnackbarOpen(true);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const amount = parseFloat(newExpense.amount);
      
      // Validate amount
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

      console.log('Sending updated expense data:', expenseData); // Debug log

      const response = await axios.put(
        `http://localhost:3001/api/expenses/${selectedExpense._id}`,
        expenseData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Extract and format the expense data from the response
      const responseData = response.data.data || response.data;
      const updatedExpenseData = {
        ...responseData,
        amount: parseFloat(responseData.amount),
        date: new Date(responseData.date).toISOString()
      };

      console.log('Received updated expense data:', updatedExpenseData); // Debug log

      // Update the expenses state with the updated expense data
      setExpenses(prev => 
        Array.isArray(prev) 
          ? prev.map(exp => exp._id === selectedExpense._id ? updatedExpenseData : exp)
          : [updatedExpenseData]
      );

      // Reset form and state
      setNewExpense({
        description: '',
        amount: '',
        category: '',
        date: new Date(),
      });
      setSelectedExpense(null);
      setAddExpenseDialogOpen(false);
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Error updating expense');
      setSnackbarOpen(true);
    }
  };

  // Add useEffect to handle form initialization when editing
  useEffect(() => {
    if (selectedExpense) {
      setNewExpense({
        description: selectedExpense.description || '',
        amount: selectedExpense.amount ? parseFloat(selectedExpense.amount).toString() : '',
        category: selectedExpense.category || '',
        date: selectedExpense.date ? new Date(selectedExpense.date) : new Date(),
      });
    } else {
      setNewExpense({
        description: '',
        amount: '',
        category: '',
        date: new Date(),
      });
    }
  }, [selectedExpense]);

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteConfirmOpen(false);
      fetchExpenses();
    } catch (err) {
      setError('Error deleting expense');
      setSnackbarOpen(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getChartData = () => {
    if (!Array.isArray(filteredExpenses)) return { labels: [], datasets: [] };

    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const dailyTotals = last7Days.map(date => ({
      date,
      total: filteredExpenses
        .filter(exp => {
          const expDate = new Date(exp.date);
          return expDate.toDateString() === date.toDateString();
        })
        .reduce((sum, exp) => {
          const amount = parseFloat(exp.amount);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0)
    }));

    return {
      labels: dailyTotals.map(d => d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Daily Expenses',
          data: dailyTotals.map(d => d.total),
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.main,
          tension: 0.4
        }
      ]
    };
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
              const expense = {
                ...params.row,
                date: new Date(params.row.date)
              };
              setSelectedExpense(expense);
              setAddExpenseDialogOpen(true);
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

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Expense Manager
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button onClick={() => navigate('/dashboard')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => navigate('/expenses')}>
          <ListItemIcon>
            <AttachMoney />
          </ListItemIcon>
          <ListItemText primary="Expenses" />
        </ListItem>
        <ListItem button onClick={() => navigate('/categories')}>
          <ListItemIcon>
            <Category />
          </ListItemIcon>
          <ListItemText primary="Categories" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  const calculateTotal = (expenseList) => {
    if (!Array.isArray(expenseList)) return '0.00';
    return expenseList
      .reduce((sum, exp) => {
        const amount = parseFloat(exp.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0)
      .toFixed(2);
  };

  const calculateMonthlyTotal = (expenseList) => {
    if (!Array.isArray(expenseList)) return '0.00';
    return expenseList
      .filter(exp => new Date(exp.date).getMonth() === new Date().getMonth())
      .reduce((sum, exp) => {
        const amount = parseFloat(exp.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0)
      .toFixed(2);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <IconButton color="inherit" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Expenses
                  </Typography>
                  <Typography variant="h4">
                    ₹{calculateTotal(expenses)}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Categories
                  </Typography>
                  <Typography variant="h4">
                    {categories.length - 1}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    This Month
                  </Typography>
                  <Typography variant="h4">
                    ₹{calculateMonthlyTotal(expenses)}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Expense Trend
                </Typography>
                <Line data={getChartData()} options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    }
                  }
                }} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Expenses List
                  </Typography>
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
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setSelectedExpense(null);
                        setAddExpenseDialogOpen(true);
                      }}
                    >
                      Add Expense
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ height: 400 }}>
                  <DataGrid
                    rows={filteredExpenses.map(expense => ({
                      ...expense,
                      id: expense._id // Ensure each row has an id property
                    }))}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5]}
                    getRowId={(row) => row._id || row.id}
                    disableSelectionOnClick
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Dialog
          open={addExpenseDialogOpen}
          onClose={() => {
            setAddExpenseDialogOpen(false);
            setSelectedExpense(null);
            setNewExpense({
              description: '',
              amount: '',
              category: '',
              date: new Date(),
            });
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedExpense ? 'Edit Expense' : 'Add New Expense'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={selectedExpense ? handleEdit : handleSubmit} sx={{ mt: 2 }}>
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
                error={newExpense.amount !== '' && isNaN(parseFloat(newExpense.amount))}
                helperText={newExpense.amount !== '' && isNaN(parseFloat(newExpense.amount)) ? 'Please enter a valid amount' : ''}
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
              setAddExpenseDialogOpen(false);
              setSelectedExpense(null);
              setNewExpense({
                description: '',
                amount: '',
                category: '',
                date: new Date(),
              });
            }}>Cancel</Button>
            <Button onClick={selectedExpense ? handleEdit : handleSubmit} variant="contained">
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
    </Box>
  );
};

export default Dashboard;