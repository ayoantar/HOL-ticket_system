import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Card,
  CardContent,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  Stack,
  useTheme,
  alpha,
  Fab,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  Skeleton,
  Divider,
  Badge
} from '@mui/material';
import {
  Edit,
  Add,
  People,
  AdminPanelSettings,
  PersonAdd,
  Lock,
  Delete,
  ToggleOn,
  ToggleOff,
  FilterList,
  Business,
  Group,
  Settings,
  Analytics,
  GetApp,
  PictureAsPdf,
  TableChart,
  Refresh,
  Email,
  Computer,
  Notifications,
  Save,
  Send,
  Security,
  Build
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';
import SystemSettingsForm from '../components/SystemSettingsForm';
import EmailTemplateEditor from '../components/EmailTemplateEditor';
import MobileUserTable from '../components/MobileUserCard';
import '../styles/AdminDashboard.css';
import MobileDepartmentTable from '../components/MobileDepartmentCard';
import MobileReportsSection from '../components/MobileReportsSection';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile, isLargePhone, isIPhoneStyle, getContainerMaxWidth } = useResponsive();
  const theme = useTheme();
  const queryClient = useQueryClient();
  
  // State for requests (removed - no longer showing requests in admin panel)
  
  // State for user management
  const [activeTab, setActiveTab] = useState(0);
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [passwordResetDialog, setPasswordResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFilters, setUserFilters] = useState({ search: '', role: '' });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    company: '',
    phone: '',
    department: ''
  });
  const [newPassword, setNewPassword] = useState('');

  // State for analytics
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('30');
  const [selectedReportType, setSelectedReportType] = useState('performance');
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    department: ''
  });

  // State for department management
  const [createDepartmentDialog, setCreateDepartmentDialog] = useState(false);
  const [editDepartmentDialog, setEditDepartmentDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    leadId: ''
  });

  // State for system settings
  const [systemSettings, setSystemSettings] = useState({
    emailSettings: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '***',
      fromName: 'Houses of Light',
      fromEmail: '',
      notificationsEnabled: true,
      testEmailRecipient: ''
    },
    systemDefaults: {
      defaultUrgency: 'normal',
      autoAssignEnabled: false,
      requestNumberPrefix: 'REQ',
      defaultRequestStatus: 'pending',
      enableFileUploads: true,
      maxFileSize: 50,
      sessionTimeout: 24,
      passwordMinLength: 8
    },
    organizationSettings: {
      organizationName: 'Houses of Light',
      supportEmail: '',
      websiteUrl: '',
      address: '',
      phone: '',
      timeZone: 'America/New_York',
      logoUrl: ''
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      notifyOnAssignment: true,
      notifyOnStatusChange: true,
      notifyOnComment: true,
      dailyDigest: false,
      weeklyReport: false
    },
    securitySettings: {
      enableTwoFactor: false,
      loginAttemptLimit: 5,
      sessionTimeout: 24,
      requirePasswordChange: false,
      passwordExpirationDays: 90,
      enableAuditLog: true,
      allowMultipleSessions: true
    },
    maintenanceSettings: {
      maintenanceMode: false,
      backupEnabled: true,
      backupFrequency: 'daily',
      autoCleanupDays: 30,
      enableSystemAlerts: true,
      debugMode: false
    }
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // System settings now handled by SystemSettingsForm component

  // System settings loading handled by SystemSettingsForm component

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <Container maxWidth={getContainerMaxWidth()}>
        <Typography variant="h4" color="error">
          Access Denied - Admin Only
        </Typography>
      </Container>
    );
  }

  // Queries for requests (removed - admin panel no longer shows request overview)
  
  // Queries for user management
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery(
    ['admin-users', userFilters],
    async () => {
      const params = new URLSearchParams(userFilters);
      const response = await axios.get(`${API_BASE_URL}/admin/users?${params}`);
      return response.data;
    },
    { enabled: activeTab === 0 }
  );
  
  const { data: userStats } = useQuery(
    'admin-user-stats',
    async () => {
      const response = await axios.get(`${API_BASE_URL}/admin/users/stats`);
      return response.data.stats;
    },
    { enabled: activeTab === 0 }
  );

  // Queries for department management (always enabled since departments are needed for user assignment)
  const { data: departments, isLoading: departmentsLoading, refetch: refetchDepartments } = useQuery(
    'admin-departments',
    async () => {
      const response = await axios.get(`${API_BASE_URL}/departments`);
      return response.data.departments;
    }
  );

  // Queries for analytics and reports
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery(
    ['admin-analytics', analyticsTimeframe],
    async () => {
      const response = await axios.get(`${API_BASE_URL}/admin/analytics?timeframe=${analyticsTimeframe}`);
      return response.data.analytics;
    },
    { enabled: activeTab === 2 }
  );

  const { data: systemMetrics, isLoading: metricsLoading } = useQuery(
    'admin-system-metrics',
    async () => {
      const response = await axios.get(`${API_BASE_URL}/admin/metrics`);
      return response.data.metrics;
    },
    { enabled: activeTab === 2 }
  );

  const { data: detailedReport, isLoading: reportLoading } = useQuery(
    ['admin-detailed-report', selectedReportType, reportFilters],
    async () => {
      const params = new URLSearchParams({
        reportType: selectedReportType,
        ...reportFilters
      });
      const response = await axios.get(`${API_BASE_URL}/admin/reports?${params}`);
      return response.data;
    },
    { 
      enabled: activeTab === 2 && selectedReportType && Object.values(reportFilters).some(v => v),
      staleTime: 5 * 60 * 1000 // Cache for 5 minutes
    }
  );

  // Query for system settings
  const { data: settingsData, isLoading: settingsDataLoading } = useQuery(
    'admin-system-settings',
    async () => {
      const response = await axios.get(`${API_BASE_URL}/admin/settings`);
      return response.data;
    },
    { 
      enabled: activeTab === 3,
      onSuccess: (data) => {
        if (data.success && data.settings) {
          setSystemSettings(data.settings);
        }
      }
    }
  );
  
  // Mutations for user management
  const createUserMutation = useMutation(
    async (userData) => {
      const response = await axios.post(`${API_BASE_URL}/admin/users`, userData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('User created successfully!');
        setCreateUserDialog(false);
        setNewUser({ name: '', email: '', password: '', role: 'user', company: '', phone: '', department: '' });
        refetchUsers();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create user');
      }
    }
  );
  
  const updateUserMutation = useMutation(
    async ({ id, userData }) => {
      const response = await axios.put(`${API_BASE_URL}/admin/users/${id}`, userData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('User updated successfully!');
        setEditUserDialog(false);
        setSelectedUser(null);
        refetchUsers();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user');
      }
    }
  );
  
  const resetPasswordMutation = useMutation(
    async ({ id, newPassword }) => {
      const response = await axios.put(`${API_BASE_URL}/admin/users/${id}/reset-password`, { newPassword });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Password reset successfully!');
        setPasswordResetDialog(false);
        setSelectedUser(null);
        setNewPassword('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      }
    }
  );
  
  const deleteUserMutation = useMutation(
    async (id) => {
      const response = await axios.delete(`${API_BASE_URL}/admin/users/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('User deleted successfully!');
        refetchUsers();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  );
  
  // Mutations for department management
  const createDepartmentMutation = useMutation(
    async (departmentData) => {
      const response = await axios.post(`${API_BASE_URL}/departments`, departmentData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Department created successfully!');
        setCreateDepartmentDialog(false);
        setNewDepartment({ name: '', description: '', leadId: '' });
        refetchDepartments();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create department');
      }
    }
  );

  const updateDepartmentMutation = useMutation(
    async ({ id, departmentData }) => {
      const response = await axios.put(`${API_BASE_URL}/departments/${id}`, departmentData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Department updated successfully!');
        setEditDepartmentDialog(false);
        setSelectedDepartment(null);
        refetchDepartments();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update department');
      }
    }
  );

  const deleteDepartmentMutation = useMutation(
    async (id) => {
      const response = await axios.delete(`${API_BASE_URL}/departments/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Department deleted successfully!');
        refetchDepartments();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete department');
      }
    }
  );

  // Department management handlers
  const handleCreateDepartment = () => {
    if (!newDepartment.name || !newDepartment.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    createDepartmentMutation.mutate(newDepartment);
  };

  const handleUpdateDepartment = () => {
    updateDepartmentMutation.mutate({ 
      id: selectedDepartment.id, 
      departmentData: selectedDepartment 
    });
  };

  const handleDeleteDepartment = (departmentId) => {
    if (window.confirm('Are you sure you want to delete this department? This will remove all employees from the department.')) {
      deleteDepartmentMutation.mutate(departmentId);
    }
  };
  
  const handleCreateUser = () => {
    // Ensure all required fields are present
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate department for employee and dept_lead roles
    if (['employee', 'dept_lead'].includes(newUser.role) && !newUser.department) {
      toast.error('Please select a department for employee and department lead roles');
      return;
    }
    
    createUserMutation.mutate(newUser);
  };
  
  const handleUpdateUser = () => {
    updateUserMutation.mutate({ id: selectedUser.id, userData: selectedUser });
  };
  
  const handleResetPassword = () => {
    resetPasswordMutation.mutate({ id: selectedUser.id, newPassword });
  };
  
  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };
  
  const handleToggleUserStatus = (userId, currentStatus) => {
    updateUserMutation.mutate({ 
      id: userId, 
      userData: { isActive: !currentStatus } 
    });
  };

  // Export handlers for analytics
  const handleExportCSV = async (reportType) => {
    try {
      const params = new URLSearchParams({
        timeframe: analyticsTimeframe,
        reportType: reportType || 'analytics'
      });
      
      const response = await axios.get(`${API_BASE_URL}/admin/export/csv?${params}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report-${analyticsTimeframe}days-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV report downloaded successfully!');
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error('Failed to export CSV report');
    }
  };

  const handleExportPDF = async () => {
    try {
      const params = new URLSearchParams({
        timeframe: analyticsTimeframe
      });
      
      const response = await axios.get(`${API_BASE_URL}/admin/export/pdf?${params}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-report-${analyticsTimeframe}days-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Failed to export PDF report');
    }
  };

  const handleRefreshData = async () => {
    try {
      await axios.post(`${API_BASE_URL}/admin/analytics/refresh`);
      
      // Invalidate and refetch analytics queries
      queryClient.invalidateQueries(['admin-analytics']);
      queryClient.invalidateQueries(['admin-system-metrics']);
      queryClient.invalidateQueries(['admin-detailed-report']);
      
      toast.success('Analytics data refreshed successfully!');
    } catch (error) {
      console.error('Refresh data error:', error);
      toast.error('Failed to refresh analytics data');
    }
  };

  // System settings handlers
  const handleSettingsChange = useCallback((category, field, value) => {
    console.log(`🔧 handleSettingsChange called: ${field} = ${value}`);
    setSystemSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [field]: value
      }
    }));
  }, []);

  // Isolated SMTP input component to prevent re-renders
  const SMTPInput = useCallback(({ label, field, value, type = "text" }) => {
    console.log(`📝 Rendering ${field} input with value:`, value);
    return (
      <TextField
        key={`smtp-${field}`}
        fullWidth
        label={label}
        type={type}
        value={value || ''}
        onChange={(e) => {
          console.log(`⌨️ ${field} changed to:`, e.target.value);
          handleSettingsChange('emailSettings', field, e.target.value);
        }}
        onFocus={() => console.log(`🎯 ${field} focused`)}
        onBlur={() => console.log(`😴 ${field} blurred`)}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
      />
    );
  }, [handleSettingsChange]);

  const handleSaveSettings = useCallback(async () => {
    try {
      setSettingsSaving(true);
      
      const response = await axios.put(`${API_BASE_URL}/admin/settings`, systemSettings);
      
      if (response.data.success) {
        toast.success('System settings updated successfully!');
        queryClient.invalidateQueries(['admin-system-settings']);
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error(error.response?.data?.message || 'Failed to update system settings');
    } finally {
      setSettingsSaving(false);
    }
  }, [systemSettings]);

  const handleTestEmail = useCallback(async () => {
    try {
      const recipient = systemSettings.emailSettings.testEmailRecipient;
      
      if (!recipient) {
        toast.error('Please enter a test email recipient first');
        return;
      }

      toast.info('Sending test email...');
      
      const response = await axios.post(`${API_BASE_URL}/admin/settings/test-email`, {
        recipient: recipient
      });

      if (response.data.success) {
        toast.success(`Test email sent successfully to ${recipient}`);
      } else {
        toast.error(response.data.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Test email error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send test email. Please check your SMTP configuration.';
      toast.error(errorMessage);
    }
  }, [systemSettings.emailSettings.testEmailRecipient]);

  // Status color function removed - no longer needed in admin panel

  const TabPanel = ({ children, value, index }) => {
    return (
      <div hidden={value !== index}>
        {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
      </div>
    );
  };
  
  return (
    <Container maxWidth={getContainerMaxWidth()} sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box mb={{ xs: 3, sm: 3, md: 4 }}>
        <Typography 
          variant={isIPhoneStyle() ? "h4" : "h3"} 
          fontWeight="700" 
          gutterBottom
          sx={{ 
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' }
          }}
        >
          Admin Dashboard
        </Typography>
        <Typography 
          variant={isIPhoneStyle() ? "body1" : "h6"} 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' } }}
        >
          Manage requests, users, and system settings
        </Typography>
      </Box>
      
      {/* Tabs */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: '16px' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant={isIPhoneStyle() ? "scrollable" : "standard"}
          scrollButtons={isIPhoneStyle() ? "auto" : false}
          allowScrollButtonsMobile={isIPhoneStyle()}
          sx={{ 
            px: { xs: 1, sm: 2 },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              minHeight: { xs: '56px', sm: '48px' },
              minWidth: { xs: '120px', sm: 'auto' },
              padding: { xs: '12px 8px', sm: '12px 16px' }
            }
          }}
        >
          <Tab 
            icon={<People />} 
            label="User Management" 
          />
          <Tab 
            icon={<Business />} 
            label="Department Management" 
          />
          <Tab 
            icon={<Analytics />} 
            label="Analytics & Reports" 
          />
          <Tab 
            icon={<Settings />} 
            label="System Settings" 
          />
          <Tab 
            icon={<Email />} 
            label="Email Templates" 
          />
        </Tabs>
      </Card>

      {/* Obsolete requests tab removed - admin no longer manages requests directly */}
      
      {/* User Management Tab */}
      <TabPanel value={activeTab} index={0}>
        {/* User Stats Cards */}
        <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: { xs: 3, sm: 3, md: 4 } }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
                  <Avatar sx={{ 
                    backgroundColor: theme.palette.primary.main,
                    width: { xs: 40, sm: 48, md: 56 },
                    height: { xs: 40, sm: 48, md: 56 }
                  }}>
                    <People sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  </Avatar>
                  <Box>
                    <Typography 
                      color="textSecondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Total Users
                    </Typography>
                    <Typography 
                      variant={isIPhoneStyle() ? "h5" : "h4"} 
                      fontWeight={700}
                      sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}
                    >
                      {userStats?.total || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
                  <Avatar sx={{ 
                    backgroundColor: theme.palette.success.main,
                    width: { xs: 40, sm: 48, md: 56 },
                    height: { xs: 40, sm: 48, md: 56 }
                  }}>
                    <ToggleOn sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  </Avatar>
                  <Box>
                    <Typography 
                      color="textSecondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Active Users
                    </Typography>
                    <Typography 
                      variant={isIPhoneStyle() ? "h5" : "h4"} 
                      color="success.main" 
                      fontWeight={700}
                      sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}
                    >
                      {userStats?.active || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
                  <Avatar sx={{ 
                    backgroundColor: theme.palette.warning.main,
                    width: { xs: 40, sm: 48, md: 56 },
                    height: { xs: 40, sm: 48, md: 56 }
                  }}>
                    <AdminPanelSettings sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  </Avatar>
                  <Box>
                    <Typography 
                      color="textSecondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Admins
                    </Typography>
                    <Typography 
                      variant={isIPhoneStyle() ? "h5" : "h4"} 
                      color="warning.main" 
                      fontWeight={700}
                      sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}
                    >
                      {userStats?.admins || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
                  <Avatar sx={{ 
                    backgroundColor: theme.palette.info.main,
                    width: { xs: 40, sm: 48, md: 56 },
                    height: { xs: 40, sm: 48, md: 56 }
                  }}>
                    <People sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  </Avatar>
                  <Box>
                    <Typography 
                      color="textSecondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Regular Users
                    </Typography>
                    <Typography 
                      variant={isIPhoneStyle() ? "h5" : "h4"} 
                      color="info.main" 
                      fontWeight={700}
                      sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}
                    >
                      {userStats?.users || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* User Filters */}
        <Card elevation={0} sx={{ mb: 3, borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} alignItems="center">
              <Grid item xs={12} sm="auto">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar sx={{ 
                    backgroundColor: alpha(theme.palette.primary.main, 0.1), 
                    color: theme.palette.primary.main,
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 }
                  }}>
                    <FilterList fontSize="small" />
                  </Avatar>
                  <Typography 
                    variant={isIPhoneStyle() ? "subtitle1" : "h6"} 
                    fontWeight={600}
                    sx={{ fontSize: { xs: '1rem', sm: '1.125rem' } }}
                  >
                    Filter Users
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Search Users"
                  value={userFilters.search}
                  onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Filter by Role"
                  value={userFilters.role}
                  onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="dept_lead">Department Lead</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* Users Table */}
        <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight={600}>
                User Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setCreateUserDialog(true)}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
              >
                Create User
              </Button>
            </Stack>
          </Box>
          {/* Mobile User Cards for small screens */}
          {isIPhoneStyle() ? (
            <MobileUserTable 
              users={users?.users || []}
              loading={usersLoading}
              onEdit={(user) => {
                setSelectedUser(user);
                setEditUserDialog(true);
              }}
              onResetPassword={(user) => {
                setSelectedUser(user);
                setPasswordResetDialog(true);
              }}
              onToggleStatus={handleToggleUserStatus}
              onDelete={handleDeleteUser}
            />
          ) : (
            <TableContainer sx={{ 
              overflowX: 'auto',
              '& .MuiTable-root': {
                minWidth: { xs: 700, sm: 'auto' }
              }
            }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton width={150} /></TableCell>
                      <TableCell><Skeleton width={200} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={100} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={150} /></TableCell>
                    </TableRow>
                  ))
                ) : users?.users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box sx={{ py: 4 }}>
                        <People sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No users found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ backgroundColor: user.role === 'admin' ? theme.palette.warning.main : user.role === 'dept_lead' ? theme.palette.info.main : theme.palette.primary.main }}>
                            {user.role === 'admin' ? <AdminPanelSettings /> : user.role === 'dept_lead' ? <Group /> : <People />}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {user.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.company || 'No company'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role === 'dept_lead' ? 'Department Lead' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          color={user.role === 'admin' ? 'warning' : user.role === 'dept_lead' ? 'info' : user.role === 'employee' ? 'success' : 'primary'}
                          size="small"
                          sx={{ borderRadius: '8px', fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        {['employee', 'dept_lead'].includes(user.role) ? (
                          user.department ? (
                            <Chip
                              label={user.department}
                              color="secondary"
                              size="small"
                              variant="outlined"
                              sx={{ borderRadius: '8px', fontWeight: 500 }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                              No department
                            </Typography>
                          )
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: '8px', fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(user.created_at), 'MMM dd, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedUser(user);
                                setEditUserDialog(true);
                              }}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reset Password">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedUser(user);
                                setPasswordResetDialog(true);
                              }}
                              sx={{ color: theme.palette.warning.main }}
                            >
                              <Lock fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                              sx={{ color: user.isActive ? theme.palette.error.main : theme.palette.success.main }}
                            >
                              {user.isActive ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          {user.role !== 'admin' && (
                            <Tooltip title="Delete User">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteUser(user.id)}
                                sx={{ color: theme.palette.error.main }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          )}
        </Card>
      </TabPanel>
      
      {/* Department Management Tab */}
      <TabPanel value={activeTab} index={1}>
        {/* Department Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ backgroundColor: theme.palette.primary.main }}>
                    <Business />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Departments
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {departments?.length || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ backgroundColor: theme.palette.warning.main }}>
                    <Group />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      With Leads
                    </Typography>
                    <Typography variant="h4" color="warning.main" fontWeight={700}>
                      {departments?.filter(dept => dept.lead).length || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ backgroundColor: theme.palette.success.main }}>
                    <People />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Employees
                    </Typography>
                    <Typography variant="h4" color="success.main" fontWeight={700}>
                      {departments?.reduce((total, dept) => total + (dept.employees?.length || 0), 0) || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ backgroundColor: theme.palette.info.main }}>
                    <AdminPanelSettings />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Average Size
                    </Typography>
                    <Typography variant="h4" color="info.main" fontWeight={700}>
                      {departments?.length ? Math.round(departments.reduce((total, dept) => total + (dept.employees?.length || 0), 0) / departments.length) : 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Departments Table */}
        <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight={600}>
                Department Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDepartmentDialog(true)}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
              >
                Create Department
              </Button>
            </Stack>
          </Box>
          {/* Mobile Department Cards for small screens */}
          {isIPhoneStyle() ? (
            <MobileDepartmentTable 
              departments={departments}
              loading={departmentsLoading}
              onEdit={(department) => {
                setSelectedDepartment(department);
                setEditDepartmentDialog(true);
              }}
              onDelete={handleDeleteDepartment}
            />
          ) : (
            <TableContainer sx={{ 
              overflowX: 'auto',
              '& .MuiTable-root': {
                minWidth: { xs: 700, sm: 'auto' }
              }
            }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Lead</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Employees</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departmentsLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton width={150} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={200} /></TableCell>
                      <TableCell><Skeleton width={100} /></TableCell>
                    </TableRow>
                  ))
                ) : departments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box sx={{ py: 4 }}>
                        <Business sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No departments found
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          Create your first department to get started
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  departments?.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ backgroundColor: theme.palette.primary.main }}>
                            <Business />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {department.name}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {department.lead ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                              {department.lead.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={500}>
                              {department.lead.name}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            No lead assigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${department.employees?.length || 0} employees`}
                          size="small"
                          color={department.employees?.length > 0 ? 'success' : 'default'}
                          variant="outlined"
                          sx={{ borderRadius: '8px', fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {department.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit Department">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedDepartment(department);
                                setEditDepartmentDialog(true);
                              }}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Department">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteDepartment(department.id)}
                              sx={{ color: theme.palette.error.main }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          )}
        </Card>
      </TabPanel>
      
      {/* Analytics & Reports Tab */}
      <TabPanel value={activeTab} index={2}>
        {isIPhoneStyle() ? (
          <Box>
            {/* Mobile Header */}
            <Box mb={3}>
              <Typography 
                variant="h5" 
                fontWeight="700" 
                gutterBottom
                sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
              >
                Analytics & Reports
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                View analytics, generate reports, and track performance.
              </Typography>
            </Box>
            
            {/* Mobile Reports Component */}
            <MobileReportsSection
              analyticsData={analyticsData}
              systemMetrics={systemMetrics}
              analyticsTimeframe={analyticsTimeframe}
              setAnalyticsTimeframe={setAnalyticsTimeframe}
              analyticsLoading={analyticsLoading}
              metricsLoading={metricsLoading}
              handleExportCSV={handleExportCSV}
              handleExportPDF={handleExportPDF}
              handleRefreshData={handleRefreshData}
            />
          </Box>
        ) : (
          <Box>
            <Box mb={4}>
              <Typography variant="h5" gutterBottom>
                Analytics & Reports
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                View comprehensive analytics, generate reports, and track system performance.
              </Typography>
              
              {/* Timeframe Filter */}
              <Card elevation={0} sx={{ mb: 3, borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
                      <FilterList />
                    </Avatar>
                    <TextField
                      select
                      size="small"
                      label="Timeframe"
                      value={analyticsTimeframe}
                      onChange={(e) => setAnalyticsTimeframe(e.target.value)}
                      sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    >
                      <MenuItem value="7">Last 7 days</MenuItem>
                      <MenuItem value="30">Last 30 days</MenuItem>
                      <MenuItem value="90">Last 3 months</MenuItem>
                      <MenuItem value="365">Last year</MenuItem>
                    </TextField>
                  </Stack>
                </CardContent>
              </Card>
              
              {/* Export and Refresh Options */}
              <Card elevation={0} sx={{ mb: 3, borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ backgroundColor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
                        <GetApp />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Export Reports
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Download analytics data in various formats
                        </Typography>
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Button
                        variant="outlined"
                        startIcon={<TableChart />}
                        onClick={() => handleExportCSV('analytics')}
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
                      >
                        Analytics CSV
                      </Button>
                      <Button
                        variant="outlined" 
                        startIcon={<TableChart />}
                        onClick={() => handleExportCSV('performance')}
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
                      >
                        Performance CSV
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<TableChart />}
                        onClick={() => handleExportCSV('activity')}
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
                      >
                        Activity CSV
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<PictureAsPdf />}
                        onClick={handleExportPDF}
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
                      >
                        Export PDF
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={handleRefreshData}
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
                      >
                        Refresh Data
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {analyticsLoading || metricsLoading ? (
              <Grid container spacing={3}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <CardContent>
                        <Skeleton height={120} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <>
                {/* Overview Statistics */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={6} sm={6} md={3}>
                    <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ backgroundColor: theme.palette.primary.main }}>
                            <Analytics />
                          </Avatar>
                          <Box>
                            <Typography color="textSecondary" gutterBottom>
                              Total Requests
                            </Typography>
                            <Typography variant="h4" fontWeight={700}>
                              {analyticsData?.overview?.total_requests || 0}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ backgroundColor: theme.palette.success.main }}>
                            <Add />
                          </Avatar>
                          <Box>
                            <Typography color="textSecondary" gutterBottom>
                              Recent Requests ({analyticsTimeframe}d)
                            </Typography>
                            <Typography variant="h4" color="success.main" fontWeight={700}>
                              {analyticsData?.overview?.recent_requests || 0}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ backgroundColor: theme.palette.warning.main }}>
                            <People />
                          </Avatar>
                          <Box>
                            <Typography color="textSecondary" gutterBottom>
                              Active Users (30d)
                            </Typography>
                            <Typography variant="h4" color="warning.main" fontWeight={700}>
                              {systemMetrics?.user_activity?.active_users || 0}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ backgroundColor: theme.palette.info.main }}>
                            <Settings />
                          </Avatar>
                          <Box>
                            <Typography color="textSecondary" gutterBottom>
                              Avg. Completion Time
                            </Typography>
                            <Typography variant="h4" color="info.main" fontWeight={700}>
                              {analyticsData?.overview?.avg_completion_time || 0}d
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Status and Type Breakdown */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <Typography variant="h6" fontWeight={600}>
                          Request Status Breakdown
                        </Typography>
                      </Box>
                      <CardContent>
                        {analyticsData?.status_breakdown?.map((status, index) => (
                          <Box key={status.status} sx={{ mb: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Chip
                                label={status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                                size="small"
                                color={status.status === 'completed' ? 'success' : status.status === 'in_progress' ? 'primary' : 'default'}
                                sx={{ borderRadius: '8px', fontWeight: 500 }}
                              />
                              <Typography variant="body2" fontWeight={600}>
                                {status.count}
                              </Typography>
                            </Stack>
                            <Box sx={{ width: '100%', height: 8, backgroundColor: alpha(theme.palette.divider, 0.1), borderRadius: '4px' }}>
                              <Box
                                sx={{
                                  width: `${(status.count / (analyticsData?.overview?.total_requests || 1)) * 100}%`,
                                  height: '100%',
                                  backgroundColor: status.status === 'completed' ? theme.palette.success.main : 
                                                  status.status === 'in_progress' ? theme.palette.primary.main : 
                                                  theme.palette.grey[400],
                                  borderRadius: '4px'
                                }}
                              />
                            </Box>
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <Typography variant="h6" fontWeight={600}>
                          Request Type Distribution
                        </Typography>
                      </Box>
                      <CardContent>
                        {analyticsData?.type_breakdown?.map((type, index) => (
                          <Box key={type.request_type} sx={{ mb: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Chip
                                label={type.request_type.charAt(0).toUpperCase() + type.request_type.slice(1)}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ borderRadius: '8px', fontWeight: 500 }}
                              />
                              <Typography variant="body2" fontWeight={600}>
                                {type.count}
                              </Typography>
                            </Stack>
                            <Box sx={{ width: '100%', height: 8, backgroundColor: alpha(theme.palette.divider, 0.1), borderRadius: '4px' }}>
                              <Box
                                sx={{
                                  width: `${(type.count / (analyticsData?.overview?.total_requests || 1)) * 100}%`,
                                  height: '100%',
                                  backgroundColor: theme.palette.primary.main,
                                  borderRadius: '4px'
                                }}
                              />
                            </Box>
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Top Performers and Department Stats */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <Typography variant="h6" fontWeight={600}>
                          Top Performers
                        </Typography>
                      </Box>
                      <CardContent>
                        {analyticsData?.top_performers?.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                            No completed requests yet
                          </Typography>
                        ) : (
                          analyticsData?.top_performers?.map((performer, index) => (
                            <Box key={performer.assigned_to} sx={{ mb: 2 }}>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                  {performer.assignedUser?.name?.charAt(0) || '?'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {performer.assignedUser?.name || 'Unknown'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {performer.assignedUser?.department || 'No department'}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={`${performer.dataValues?.completed_count || 0} completed`}
                                  size="small"
                                  color="success"
                                  sx={{ borderRadius: '8px', fontWeight: 500 }}
                                />
                              </Stack>
                            </Box>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <Typography variant="h6" fontWeight={600}>
                          Department Workload
                        </Typography>
                      </Box>
                      <CardContent>
                        {analyticsData?.department_breakdown?.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                            No department assignments yet
                          </Typography>
                        ) : (
                          analyticsData?.department_breakdown?.map((dept, index) => (
                            <Box key={dept.department} sx={{ mb: 2 }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {dept.department || 'Unassigned'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {dept.count} requests
                                </Typography>
                              </Stack>
                              <Box sx={{ width: '100%', height: 6, backgroundColor: alpha(theme.palette.divider, 0.1), borderRadius: '3px' }}>
                                <Box
                                  sx={{
                                    width: `${(dept.count / Math.max(...(analyticsData?.department_breakdown?.map(d => d.count) || [1]))) * 100}%`,
                                    height: '100%',
                                    backgroundColor: theme.palette.secondary.main,
                                    borderRadius: '3px'
                                  }}
                                />
                              </Box>
                            </Box>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}
          </Box>
        )}
      </TabPanel>
      
      {/* System Settings Tab */}
      <TabPanel value={activeTab} index={3}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            System Settings
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Configure system-wide settings, email templates, and application preferences for Houses of Light.
          </Typography>
        </Box>
        
        <SystemSettingsForm />
      </TabPanel>

      {/* Email Templates Tab */}
      <TabPanel value={activeTab} index={4}>
        <EmailTemplateEditor />
      </TabPanel>

      {/* Update Status Dialog removed - no longer needed in admin panel */}
      
      {/* Create User Dialog */}
      <Dialog open={createUserDialog} onClose={() => setCreateUserDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ backgroundColor: theme.palette.primary.main }}>
              <PersonAdd />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Create New User
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ pt: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Role"
                value={newUser.role}
                onChange={(e) => {
                  setNewUser({ 
                    ...newUser, 
                    role: e.target.value,
                    // Clear department if not employee or dept_lead
                    department: ['employee', 'dept_lead'].includes(e.target.value) ? newUser.department : ''
                  });
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="dept_lead">Department Lead</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </Grid>
            {/* Conditional Department Field */}
            {['employee', 'dept_lead'].includes(newUser.role) && (
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Department"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  required
                >
                  <MenuItem value="">Select Department</MenuItem>
                  {departments?.map((dept) => (
                    <MenuItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company"
                value={newUser.company}
                onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCreateUserDialog(false)} sx={{ borderRadius: '12px' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained"
            disabled={
              createUserMutation.isLoading || 
              !newUser.name || 
              !newUser.email || 
              !newUser.password ||
              (['employee', 'dept_lead'].includes(newUser.role) && !newUser.department)
            }
            sx={{ borderRadius: '12px', fontWeight: 600 }}
          >
            {createUserMutation.isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={editUserDialog} onClose={() => setEditUserDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ backgroundColor: theme.palette.warning.main }}>
              <Edit />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Edit User
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={3} sx={{ pt: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={selectedUser.name || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={selectedUser.email || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Role"
                  value={selectedUser.role || 'user'}
                  onChange={(e) => {
                    setSelectedUser({ 
                      ...selectedUser, 
                      role: e.target.value,
                      // Clear department if not employee or dept_lead
                      department: ['employee', 'dept_lead'].includes(e.target.value) ? selectedUser.department : ''
                    });
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="dept_lead">Department Lead</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </TextField>
              </Grid>
              {/* Conditional Department Field for Edit */}
              {['employee', 'dept_lead'].includes(selectedUser?.role) && (
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Department"
                    value={selectedUser.department || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  >
                    <MenuItem value="">Select Department</MenuItem>
                    {departments?.map((dept) => (
                      <MenuItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company"
                  value={selectedUser.company || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, company: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedUser.isActive || false}
                      onChange={(e) => setSelectedUser({ ...selectedUser, isActive: e.target.checked })}
                    />
                  }
                  label="Active User"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditUserDialog(false)} sx={{ borderRadius: '12px' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateUser} 
            variant="contained"
            disabled={updateUserMutation.isLoading}
            sx={{ borderRadius: '12px', fontWeight: 600 }}
          >
            {updateUserMutation.isLoading ? 'Updating...' : 'Update User'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Password Reset Dialog */}
      <Dialog open={passwordResetDialog} onClose={() => setPasswordResetDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ backgroundColor: theme.palette.error.main }}>
              <Lock />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Reset Password
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
            This will reset the user's password. They will need to use the new password to login.
          </Alert>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            helperText="Password must be at least 6 characters long"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPasswordResetDialog(false)} sx={{ borderRadius: '12px' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleResetPassword} 
            variant="contained"
            color="error"
            disabled={resetPasswordMutation.isLoading || newPassword.length < 6}
            sx={{ borderRadius: '12px', fontWeight: 600 }}
          >
            {resetPasswordMutation.isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Create Department Dialog */}
      <Dialog open={createDepartmentDialog} onClose={() => setCreateDepartmentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ backgroundColor: theme.palette.primary.main }}>
              <Business />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Create Department
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ pt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Department Name"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newDepartment.description}
                onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Department Lead (Optional)"
                value={newDepartment.leadId}
                onChange={(e) => setNewDepartment({ ...newDepartment, leadId: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              >
                <MenuItem value="">No lead assigned</MenuItem>
                {users?.users
                  ?.filter(user => user.role === 'employee' || user.role === 'dept_lead')
                  .map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCreateDepartmentDialog(false)} sx={{ borderRadius: '12px' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateDepartment} 
            variant="contained"
            disabled={createDepartmentMutation.isLoading || !newDepartment.name || !newDepartment.description}
            sx={{ borderRadius: '12px', fontWeight: 600 }}
          >
            {createDepartmentMutation.isLoading ? 'Creating...' : 'Create Department'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Department Dialog */}
      <Dialog open={editDepartmentDialog} onClose={() => setEditDepartmentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ backgroundColor: theme.palette.warning.main }}>
              <Edit />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Edit Department
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedDepartment && (
            <Grid container spacing={3} sx={{ pt: 2 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Department Name"
                  value={selectedDepartment.name || ''}
                  onChange={(e) => setSelectedDepartment({ ...selectedDepartment, name: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={selectedDepartment.description || ''}
                  onChange={(e) => setSelectedDepartment({ ...selectedDepartment, description: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Department Lead"
                  value={selectedDepartment.leadId || ''}
                  onChange={(e) => setSelectedDepartment({ ...selectedDepartment, leadId: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                >
                  <MenuItem value="">No lead assigned</MenuItem>
                  {users?.users
                    ?.filter(user => user.role === 'employee' || user.role === 'dept_lead')
                    .map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDepartmentDialog(false)} sx={{ borderRadius: '12px' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateDepartment} 
            variant="contained"
            disabled={updateDepartmentMutation.isLoading}
            sx={{ borderRadius: '12px', fontWeight: 600 }}
          >
            {updateDepartmentMutation.isLoading ? 'Updating...' : 'Update Department'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;