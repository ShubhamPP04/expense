import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  TextField,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { motion } from 'framer-motion';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [severity, setSeverity] = useState('error');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      showNotification('Error fetching categories', 'error');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      showNotification('Category name cannot be empty', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3001/api/categories', { name: newCategory }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCategory('');
      fetchCategories();
      showNotification('Category added successfully', 'success');
    } catch (err) {
      showNotification('Error adding category', 'error');
    }
  };

  const handleDeleteCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/categories/${selectedCategory._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteDialogOpen(false);
      fetchCategories();
      showNotification('Category deleted successfully', 'success');
    } catch (err) {
      showNotification('Error deleting category', 'error');
    }
  };

  const handleEditCategory = async () => {
    if (!editCategory.name.trim()) {
      showNotification('Category name cannot be empty', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3001/api/categories/${editCategory._id}`, 
        { name: editCategory.name },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setEditDialogOpen(false);
      fetchCategories();
      showNotification('Category updated successfully', 'success');
    } catch (err) {
      showNotification('Error updating category', 'error');
    }
  };

  const showNotification = (message, severity) => {
    setSeverity(severity);
    if (severity === 'error') {
      setError(message);
    } else {
      setSuccess(message);
    }
    setSnackbarOpen(true);
  };

  const columns = [
    { 
      field: 'name', 
      headerName: 'Category Name', 
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon color="primary" />
          <Typography>{params.value}</Typography>
        </Box>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Created Date',
      flex: 1,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit Category">
            <IconButton
              onClick={() => {
                setEditCategory(params.row);
                setEditDialogOpen(true);
              }}
              size="small"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Category">
            <IconButton
              onClick={() => {
                setSelectedCategory(params.row);
                setDeleteDialogOpen(true);
              }}
              size="small"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CategoryIcon fontSize="large" />
              Category Management
            </Typography>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add New Category
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="Category Name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddCategory}
                  >
                    Add
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistics
                </Typography>
                <Typography variant="h3" color="primary">
                  {categories.length}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  Total Categories
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Paper sx={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={categories}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                getRowId={(row) => row._id}
                disableSelectionOnClick
                sx={{
                  '& .MuiDataGrid-cell': {
                    borderBottom: 'none',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: 'background.paper',
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                  },
                }}
              />
            </Paper>
          </motion.div>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the category "{selectedCategory?.name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteCategory} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      >
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={editCategory?.name || ''}
            onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditCategory} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={severity}
          sx={{ width: '100%' }}
        >
          {severity === 'error' ? error : success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Categories; 