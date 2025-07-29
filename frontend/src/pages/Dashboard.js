import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  TextField,
  IconButton,
  TablePagination,
  Card,
  CardContent,
  Avatar,
  Skeleton,
  useTheme,
  alpha,
  Fade,
  Stack,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add,
  Visibility,
  FilterList,
  ConfirmationNumber,
  Schedule,
  TrendingUp,
  Assignment,
  CalendarToday,
  Business,
  ViewList,
  Person,
  Group,
  PersonAdd,
  Delete
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { useResponsive } from '../hooks/useResponsive';
import MobileTable from '../components/MobileTable';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isMobile, isLargePhone, isIPhoneStyle, getContainerMaxWidth } = useResponsive();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    urgency: ''
  });
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Compute tabs based on user role
  const getTabs = () => {
    const deptName = user?.department || 'Department';
    
    if (user?.role === 'dept_lead') {
      return [
        { value: 0, label: `${deptName}`, icon: <Group /> },
        { value: 1, label: 'My Requests', icon: <Person /> }
      ];
    } else if (user?.role === 'employee') {
      return [
        { value: 0, label: `${deptName}`, icon: <Group /> },
        { value: 1, label: 'My Requests', icon: <Person /> }
      ];
    } else if (user?.role === 'user') {
      return [
        { value: 0, label: 'My Requests', icon: <ViewList /> }
      ];
    } else if (user?.role === 'admin') {
      return [
        { value: 0, label: 'All Requests', icon: <ViewList /> },
        { value: 1, label: 'My Requests', icon: <Person /> }
      ];
    }
    return [];
  };
  
  const tabs = getTabs();
  
  
  // Manual tab switching approach - no automatic resets needed
  
  
  // Assignment state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assignedTo, setAssignedTo] = useState('');
  const [department, setDepartment] = useState('');
  
  // Track viewed requests with localStorage persistence and last activity timestamp
  const [viewedRequests, setViewedRequests] = useState(() => {
    try {
      const saved = localStorage.getItem('viewedRequests');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  
  const [requestActivities, setRequestActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('requestActivities');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Handle request click
  const handleRequestClick = (requestId) => {
    // Mark request as viewed
    setViewedRequests(prev => {
      const newSet = new Set(prev).add(requestId);
      // Persist to localStorage
      try {
        localStorage.setItem('viewedRequests', JSON.stringify([...newSet]));
      } catch (e) {
        console.warn('Failed to save viewed requests to localStorage:', e);
      }
      return newSet;
    });
    
    // Update activity timestamp for this request
    setRequestActivities(prev => {
      const updated = {
        ...prev,
        [requestId]: new Date().toISOString()
      };
      try {
        localStorage.setItem('requestActivities', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save request activities to localStorage:', e);
      }
      return updated;
    });
    
    navigate(`/requests/${requestId}`);
  };

  // Assignment handlers
  const handleAssignRequest = (request) => {
    setSelectedRequest(request);
    setAssignDialogOpen(true);
    setAssignedTo('');
    // For dept_leads, automatically set their department
    if (user?.role === 'dept_lead') {
      setDepartment(user.department);
    } else {
      setDepartment('');
    }
  };

  const handleAssignSubmit = () => {
    if (!assignedTo || !department) {
      console.error('Please select both employee and department');
      return;
    }
    assignRequestMutation.mutate({
      requestId: selectedRequest.id,
      assignedTo,
      department
    });
  };

  const handleDeleteRequest = (request) => {
    if (window.confirm(`Are you sure you want to delete request ${request.requestNumber}? This action cannot be undone.`)) {
      deleteRequestMutation.mutate(request.id);
    }
  };

  const { data, isLoading, error } = useQuery(
    ['requests', page, rowsPerPage, filters, activeTab, user?.role, user?.department],
    async () => {
      let endpoint = `${API_BASE_URL}/requests`;
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      };
      
      
      // Route to appropriate endpoint based on tab and user role
      if (user?.role === 'dept_lead') {
        // For department leads: Tab 0 = Department, Tab 1 = My Requests
        if (activeTab === 1) {
          endpoint = `${API_BASE_URL}/requests/my`;
        } else {
          endpoint = `${API_BASE_URL}/requests/department`;
        }
      } else if (user?.role === 'employee') {
        // For employees: Tab 0 = Department, Tab 1 = My Requests
        if (activeTab === 1) {
          endpoint = `${API_BASE_URL}/requests/my`;
        } else {
          endpoint = `${API_BASE_URL}/requests/department`;
        }
      } else {
        // For users/admins: Tab 0 = All, Tab 1 = My Requests (if applicable)
        if (activeTab === 1) {
          endpoint = `${API_BASE_URL}/requests/my`;
        } else {
          endpoint = `${API_BASE_URL}/requests`;
        }
      }
      
      const response = await axios.get(endpoint, { params });
      return response.data;
    }
  );

  // Query for getting employees when admin or dept_lead wants to assign
  const { data: employees } = useQuery(
    ['employees', department],
    async () => {
      if (!department) return [];
      const response = await axios.get(`${API_BASE_URL}/departments/${department}/employees`);
      return response.data.employees || [];
    },
    { enabled: !!department && (user?.role === 'admin' || user?.role === 'dept_lead') }
  );

  // Mutation for assigning requests
  const assignRequestMutation = useMutation(
    async ({ requestId, assignedTo, department }) => {
      const response = await axios.post(`${API_BASE_URL}/requests/${requestId}/assign`, {
        assignedTo,
        department
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['requests']);
        setAssignDialogOpen(false);
        setSelectedRequest(null);
        setAssignedTo('');
        setDepartment('');
      },
      onError: (error) => {
        console.error('Assignment failed:', error);
      }
    }
  );

  // Mutation for deleting requests
  const deleteRequestMutation = useMutation(
    async (requestId) => {
      const response = await axios.delete(`${API_BASE_URL}/requests/${requestId}`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['requests']);
        console.log(`Request ${data.requestNumber} deleted successfully`);
      },
      onError: (error) => {
        console.error('Delete failed:', error);
      }
    }
  );

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'error',
      on_hold: 'secondary'
    };
    return colors[status] || 'default';
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      normal: 'success',
      urgent: 'error'
    };
    return colors[urgency] || 'default';
  };

  const getStatsFromRequests = () => {
    const requests = data?.requests;
    if (!requests) return { total: 0, pending: 0, inProgress: 0, completed: 0 };
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      inProgress: requests.filter(r => ['in_progress', 'on_hold'].includes(r.status)).length,
      completed: requests.filter(r => r.status === 'completed').length
    };
  };

  const stats = getStatsFromRequests();

  // Get current requests for pagination and mobile display
  const currentRequests = data?.requests || [];

  // Handle assign click for mobile table
  const handleAssignClick = (request) => {
    handleAssignRequest(request);
  };

  return (
    <Container 
      maxWidth={getContainerMaxWidth()} 
      sx={{ 
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2, md: 3 }
      }}
    >
      {/* Header Section */}
      <Box mb={{ xs: 2, sm: 3, md: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box>
              <Typography 
                variant={isIPhoneStyle() ? "h4" : "h3"}
                fontWeight="700" 
                color="text.primary"
                gutterBottom
                sx={{ 
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' }
                }}
              >
                {t('dashboard.title')}
              </Typography>
              
              
              {/* Tab Navigation */}
              {user?.role && (
                <Tabs 
                  value={activeTab}
                  onChange={(event, newValue) => {
                    setActiveTab(newValue);
                    setPage(0);
                  }}
                  variant={isIPhoneStyle() ? "scrollable" : "standard"}
                  scrollButtons={isIPhoneStyle() ? "auto" : false}
                  allowScrollButtonsMobile={isIPhoneStyle()}
                  sx={{ 
                    mb: 2,
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: isIPhoneStyle() ? '0.875rem' : '1rem',
                      minHeight: isIPhoneStyle() ? '52px' : '48px',
                      minWidth: isIPhoneStyle() ? '120px' : 'auto'
                    }
                  }}
                >
                {tabs.map((tab) => (
                  <Tab 
                    key={tab.value}
                    value={tab.value} 
                    icon={tab.icon}
                    label={tab.label}
                    iconPosition="start"
                    sx={{ mr: 1 }}
                    onMouseDown={() => {
                      setActiveTab(tab.value);
                      setPage(0);
                    }}
                  />
                ))}
              </Tabs>
              )}
              <Typography 
                variant="h6" 
                color="text.secondary"
                sx={{ fontWeight: 400 }}
              >
                Welcome back, {user?.name}! {
                  user?.role === 'dept_lead' ? (
                    activeTab === 0 ? `Here are your ${user?.department || 'department'}'s requests.` :
                    "Here are your assigned requests."
                  ) : user?.role === 'employee' ? (
                    activeTab === 0 ? `Here are your ${user?.department || 'department'}'s requests.` :
                    "Here are your assigned requests."
                  ) : user?.role === 'user' ? (
                    "Here are your submitted requests."
                  ) : user?.role === 'admin' ? (
                    activeTab === 0 ? "Here's the overview of all requests." :
                    "Here are your assigned requests."
                  ) : "Here's your request overview."
                }
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => navigate('/requests/new')}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`
                },
                transition: 'all 0.3s ease'
              }}
            >
              Create New Request
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: { xs: 3, sm: 3, md: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <Fade in timeout={300}>
            <Card 
              elevation={0}
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      width: { xs: 48, sm: 52, md: 56 },
                      height: { xs: 48, sm: 52, md: 56 }
                    }}
                  >
                    <ConfirmationNumber sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  </Avatar>
                  <Box>
                    <Typography 
                      variant={isIPhoneStyle() ? "h5" : "h4"} 
                      fontWeight="700" 
                      color="text.primary"
                      sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}
                    >
                      {isLoading ? <Skeleton width={40} /> : stats.total}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      fontWeight={500}
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Total Requests
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Fade in timeout={500}>
            <Card 
              elevation={0}
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.05)})`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.warning.main, 0.15)}`
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: theme.palette.warning.main,
                      width: { xs: 48, sm: 52, md: 56 },
                      height: { xs: 48, sm: 52, md: 56 }
                    }}
                  >
                    <Schedule sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  </Avatar>
                  <Box>
                    <Typography 
                      variant={isIPhoneStyle() ? "h5" : "h4"} 
                      fontWeight="700" 
                      color="text.primary"
                      sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}
                    >
                      {isLoading ? <Skeleton width={40} /> : stats.pending}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      fontWeight={500}
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Pending
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Fade in timeout={700}>
            <Card 
              elevation={0}
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.main, 0.05)})`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.info.main, 0.15)}`
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: theme.palette.info.main,
                      width: { xs: 48, sm: 52, md: 56 },
                      height: { xs: 48, sm: 52, md: 56 }
                    }}
                  >
                    <TrendingUp sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  </Avatar>
                  <Box>
                    <Typography 
                      variant={isIPhoneStyle() ? "h5" : "h4"} 
                      fontWeight="700" 
                      color="text.primary"
                      sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}
                    >
                      {isLoading ? <Skeleton width={40} /> : stats.inProgress}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      fontWeight={500}
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      In Progress
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Fade in timeout={900}>
            <Card 
              elevation={0}
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.success.main, 0.15)}`
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: theme.palette.success.main,
                      width: { xs: 48, sm: 52, md: 56 },
                      height: { xs: 48, sm: 52, md: 56 }
                    }}
                  >
                    <Assignment sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  </Avatar>
                  <Box>
                    <Typography 
                      variant={isIPhoneStyle() ? "h5" : "h4"} 
                      fontWeight="700" 
                      color="text.primary"
                      sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}
                    >
                      {isLoading ? <Skeleton width={40} /> : stats.completed}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      fontWeight={500}
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Completed
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* Filters Section */}
      <Card 
        elevation={0}
        sx={{ 
          mb: 3, 
          borderRadius: '16px',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(20px)'
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Grid container spacing={{ xs: 2, sm: 3 }} alignItems="center">
            <Grid item xs={12} sm="auto">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 }
                  }}
                >
                  <FilterList fontSize="small" />
                </Avatar>
                <Typography 
                  variant={isIPhoneStyle() ? "subtitle1" : "h6"} 
                  fontWeight={600}
                  sx={{ fontSize: { xs: '1rem', sm: '1.125rem' } }}
                >
                  Filter Requests
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px'
                  }
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="on_hold">On Hold</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Urgency"
                value={filters.urgency}
                onChange={(e) => handleFilterChange('urgency', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px'
                  }
                }}
              >
                <MenuItem value="">All Urgencies</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card 
        elevation={0}
        sx={{ 
          borderRadius: '16px',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Typography variant="h6" fontWeight={600}>
            Recent Requests
          </Typography>
        </Box>
        {/* Mobile Table for small screens */}
        {isIPhoneStyle() ? (
          <MobileTable 
            requests={currentRequests}
            onView={handleRequestClick}
            onAssign={user?.role === 'admin' ? handleAssignClick : undefined}
            showAssignButton={user?.role === 'admin'}
            loading={isLoading}
          />
        ) : (
          <TableContainer>
            <Table>
            <TableHead>
              <TableRow sx={{ 
                backgroundColor: alpha(theme.palette.primary.main, 0.02)
              }}>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ConfirmationNumber fontSize="small" />
                    <span>Request #</span>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Business fontSize="small" />
                    <span>Type</span>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CalendarToday fontSize="small" />
                    <span>Created</span>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Urgency</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Assigned To</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={180} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={60} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={40} /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 4 }}>
                      <Typography color="error">Error loading requests</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (data?.requests)?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 6 }}>
                      <ConfirmationNumber sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No requests found
                      </Typography>
                      <Typography color="text.disabled">
                        {
                          user?.role === 'dept_lead' ? (
                            activeTab === 1 ? 'No requests are assigned to you' :
                            'No requests in your department'
                          ) : user?.role === 'employee' ? (
                            activeTab === 1 ? 'No requests are assigned to you' :
                            'No requests in your department'
                          ) : user?.role === 'user' ? (
                            'Get started by creating your first request'
                          ) : user?.role === 'admin' ? (
                            activeTab === 1 ? 'No requests are assigned to you' :
                            'No requests found'
                          ) : 'No requests found'
                        }
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                (data?.requests)?.map((request, index) => {
                  const hasUnread = request.unreadCount && request.unreadCount > 0;
                  const isViewed = viewedRequests.has(request.id);
                  const hasRecentActivity = request.hasRecentActivity;
                  
                  // Check if this request has new activity since last viewed
                  const lastViewedActivity = requestActivities[request.id];
                  const requestLastActivity = request.lastActivityAt;
                  const hasNewActivity = lastViewedActivity && requestLastActivity && 
                    new Date(requestLastActivity) > new Date(lastViewedActivity);
                  
                  // Simplified: highlight for any type of update (unread messages OR recent activity)
                  const shouldHighlight = !isViewed && (hasUnread || hasRecentActivity || hasNewActivity);
                  
                  
                  return (
                    <Fade in timeout={300 + index * 100} key={request.id}>
                      <TableRow 
                        sx={{ 
                          backgroundColor: shouldHighlight 
                            ? alpha(theme.palette.info.main, 0.08) 
                            : 'transparent',
                          borderLeft: shouldHighlight 
                            ? `4px solid ${theme.palette.info.main}` 
                            : 'none',
                          '&:hover': { 
                            backgroundColor: shouldHighlight 
                              ? alpha(theme.palette.info.main, 0.12) 
                              : alpha(theme.palette.primary.main, 0.02),
                            transform: 'scale(1.001)',
                            transition: 'all 0.2s ease'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight={shouldHighlight ? 700 : 600} 
                          color="primary"
                          sx={{
                            textShadow: shouldHighlight ? '0 0 1px rgba(0,0,0,0.3)' : 'none'
                          }}
                        >
                          {request.requestNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {request.requestType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(request.created_at), 'MMM dd, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status)}
                          size="small"
                          sx={{ 
                            fontWeight: 500,
                            borderRadius: '8px'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.urgency}
                          color={getUrgencyColor(request.urgency)}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontWeight: 500,
                            borderRadius: '8px'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {request.assignedTo ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                              {request.assignedUser?.name?.charAt(0) || 'U'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {request.assignedUser?.name || 'Unknown'}
                              </Typography>
                              {request.assignedTo === user?.id && (
                                <Chip 
                                  label="You" 
                                  size="small" 
                                  color="success" 
                                  variant="filled"
                                  sx={{ fontSize: '0.6rem', height: '16px' }}
                                />
                              )}
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleRequestClick(request.id)}
                            sx={{
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          {(user?.role === 'admin' || user?.role === 'dept_lead') && !request.assignedTo && (
                            <IconButton
                              size="small"
                              onClick={() => handleAssignRequest(request)}
                              sx={{
                                backgroundColor: alpha(theme.palette.success.main, 0.1),
                                color: theme.palette.success.main,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.success.main, 0.2),
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <PersonAdd fontSize="small" />
                            </IconButton>
                          )}
                          {(user?.role === 'admin' || user?.role === 'dept_lead') && (
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteRequest(request)}
                              sx={{
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                color: theme.palette.error.main,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  </Fade>
                  );
                })
              )}
            </TableBody>
          </Table>
          {data?.requests && (
            <TablePagination
              component="div"
              count={data.totalPages * rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.5)
              }}
            />
          )}
        </TableContainer>
        )}
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonAdd />
            <Typography variant="h6">Assign Request</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <Typography variant="body1">
              Assign request <strong>{selectedRequest?.requestNumber}</strong> to an employee
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                label="Department"
                disabled={user?.role === 'dept_lead'} // Dept leads can only assign within their department
              >
                {user?.role === 'dept_lead' ? (
                  // Department leads can only see their own department
                  <MenuItem value={user.department}>{user.department}</MenuItem>
                ) : (
                  // Admins can see all departments
                  <>
                    <MenuItem value="IT Support">IT Support</MenuItem>
                    <MenuItem value="Graphic Design">Graphic Design</MenuItem>
                    <MenuItem value="Event Management">Event Management</MenuItem>
                    <MenuItem value="Web Support">Web Support</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!department}>
              <InputLabel>Employee</InputLabel>
              <Select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                label="Employee"
              >
                {employees?.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name} ({employee.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAssignSubmit}
            disabled={!assignedTo || !department || assignRequestMutation.isLoading}
          >
            {assignRequestMutation.isLoading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;