import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, createTheme } from '@mui/material';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Categories from './components/Categories';
import ExpenseForm from './components/ExpenseForm';
import Expenses from './components/Expenses';
import './styles/modern.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const appliedTheme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#ffffff' : '#000000',
      },
      secondary: {
        main: isDarkMode ? '#000000' : '#ffffff',
      },
      background: {
        default: isDarkMode ? '#121212' : '#ffffff',
        paper: isDarkMode ? '#1e1e1e' : '#f5f5f5',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#000000',
        secondary: isDarkMode ? '#a0a0a0' : '#2c2c2c',
      },
    },
  });

  return (
    <ThemeProvider theme={appliedTheme}>
      <CssBaseline />
      <Router>
        <Box 
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/add-expense" element={<ExpenseForm />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
