import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import 'react-toastify/dist/ReactToastify.css';
import './styles/mobile-fixes.css'; // Mobile-specific CSS fixes
import './i18n'; // Initialize i18n

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewRequestForm from './pages/NewRequestForm';
import RequestDetail from './pages/RequestDetail';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  breakpoints: {
    values: {
      xs: 0,      // 0-479px - Small phones (iPhone SE, older phones)
      sm: 480,    // 480-767px - Large phones (iPhone 15 Plus, large Android phones)
      md: 768,    // 768-1023px - Tablets
      lg: 1024,   // 1024-1439px - Small desktops/laptops
      xl: 1440,   // 1440px+ - Large desktops
    },
  },
  typography: {
    // Mobile-optimized typography for better readability on large phones
    h1: {
      fontSize: '1.75rem',
      '@media (min-width:480px)': {
        fontSize: '2rem',
      },
      '@media (min-width:768px)': {
        fontSize: '2.5rem',
      },
    },
    h2: {
      fontSize: '1.5rem',
      '@media (min-width:480px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:768px)': {
        fontSize: '2rem',
      },
    },
    h3: {
      fontSize: '1.25rem',
      '@media (min-width:480px)': {
        fontSize: '1.5rem',
      },
      '@media (min-width:768px)': {
        fontSize: '1.75rem',
      },
    },
    h4: {
      fontSize: '1.125rem',
      '@media (min-width:480px)': {
        fontSize: '1.25rem',
      },
      '@media (min-width:768px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontSize: '1rem',
      '@media (min-width:480px)': {
        fontSize: '1.125rem',
      },
      '@media (min-width:768px)': {
        fontSize: '1.25rem',
      },
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      '@media (min-width:480px)': {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.4,
      '@media (min-width:480px)': {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
    },
  },
  components: {
    // Mobile-optimized component overrides
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: '48px', // Larger touch target for iPhone 15 Plus
          fontSize: '1rem',
          '@media (max-width:479px)': {
            fontSize: '0.875rem',
            padding: '12px 20px',
            minHeight: '44px',
          },
          '@media (min-width:480px) and (max-width:767px)': {
            fontSize: '1rem',
            padding: '14px 24px',
            minHeight: '48px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: '48px', // Larger for better touch on iPhone 15 Plus
            fontSize: '1rem',
          },
          '& .MuiInputLabel-root': {
            fontSize: '1rem',
          },
          '@media (max-width:479px)': {
            '& .MuiInputBase-root': {
              minHeight: '44px',
              fontSize: '0.875rem',
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.875rem',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          '@media (max-width:767px)': {
            padding: '12px 8px',
            fontSize: '0.875rem',
          },
          '@media (max-width:479px)': {
            padding: '8px',
            fontSize: '0.75rem',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          '@media (max-width:767px)': {
            margin: '12px 0',
            borderRadius: '12px',
          },
          '@media (max-width:479px)': {
            margin: '8px 0',
            borderRadius: '8px',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:479px)': {
            paddingLeft: '12px',
            paddingRight: '12px',
          },
          '@media (min-width:480px) and (max-width:767px)': {
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          '@media (max-width:767px)': {
            '& .MuiToolbar-root': {
              minHeight: '56px',
              paddingLeft: '12px',
              paddingRight: '12px',
            },
          },
        },
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="requests/new" element={<NewRequestForm />} />
                <Route path="requests/:id" element={<RequestDetail />} />
                <Route path="admin" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </Router>
          <ToastContainer position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;