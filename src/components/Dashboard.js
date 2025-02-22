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
    const uniqueCategories = [...new Set(expenses.map(exp => exp.category))];
    setCategories(['all', ...uniqueCategories]);
    if (selectedCategory === 'all') {
      setFilteredExpenses(expenses);
    } else {
      setFilteredExpenses(expenses.filter(exp => exp.category === selectedCategory));
    }
  }, [expenses, selectedCategory]);

  useEffect(() => {
    setFilteredExpenses(applyFilters(expenses));
  }, [expenses, selectedCategory, dateRange, amountRange]);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data);
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
      await axios.post('http://localhost:3001/api/expenses', newExpense, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewExpense({
        description: '',
        amount: '',
        category: '',
        date: new Date(),
      });
      setAddExpenseDialogOpen(false);
      fetchExpenses();
    } catch (err) {
      setError('Error creating expense');
      setSnackbarOpen(true);
    }
  };

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
        .reduce((sum, exp) => sum + Number(exp.amount), 0)
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
    return expenses.filter(expense => {
      const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
      const matchesDateRange = (!dateRange.start || new Date(expense.date) >= new Date(dateRange.start)) &&
        (!dateRange.end || new Date(expense.date) <= new Date(dateRange.end));
      const matchesAmountRange = (!amountRange.min || expense.amount >= Number(amountRange.min)) &&
        (!amountRange.max || expense.amount <= Number(amountRange.max));
      
      return matchesCategory && matchesDateRange && matchesAmountRange;
    });
  };

  const columns = [
    { field: 'description', headerName: 'Description', flex: 1 },
    { 
      field: 'amount', 
      headerName: 'Amount', 
      flex: 1, 
      valueFormatter: (params) => `₹${Number(params.value).toFixed(2)}` 
    },
    { field: 'category', headerName: 'Category', flex: 1 },
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
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
                    ₹{expenses.reduce((sum, exp) => sum + Number(exp.amount), 0).toFixed(2)}
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
                    ₹{expenses
                      .filter(exp => new Date(exp.date).getMonth() === new Date().getMonth())
                      .reduce((sum, exp) => sum + Number(exp.amount), 0)
                      .toFixed(2)}
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
                          {category.charAt(0).toUpperCase() + category.slice(1)}
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
                    rows={filteredExpenses}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5]}
                    getRowId={(row) => row._id}
                    disableSelectionOnClick
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Dialog
          open={addExpenseDialogOpen}
          onClose={() => setAddExpenseDialogOpen(false)}
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
            <Button onClick={() => setAddExpenseDialogOpen(false)}>Cancel</Button>
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
    </Box>
  );
};

export default Dashboard;