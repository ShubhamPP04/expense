import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Alert } from '@mui/material';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState(null);

  const checkDatabase = async () => {
    try {
      const response = await fetch('/api/expenses');
      if (!response.ok) {
        throw new Error('Failed to fetch expenses from database');
      }
      const data = await response.json();
      console.log('Database expenses:', data);
    } catch (err) {
      console.error('Error checking database:', err);
    }
  };

  useEffect(() => {
    checkDatabase(); // Call the function to check the database
    const fetchExpenses = async () => {
      try {
        const response = await fetch('/api/expenses');
        if (!response.ok) {
          throw new Error('Failed to fetch expenses');
        }
        const data = await response.json();
        console.log('Fetched expenses:', data);
        setExpenses(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching expenses:', err);
      }
    };

    fetchExpenses();
  }, []);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Expenses
      </Typography>
      <List>
        {expenses.map((expense) => (
          <ListItem key={expense._id}>
            <ListItemText
              primary={expense.description}
              secondary={`$${expense.amount} - ${new Date(expense.date).toLocaleDateString()}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Expenses; 