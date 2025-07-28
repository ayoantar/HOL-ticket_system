import React, { useState } from 'react';
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
  Analytics
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // State for department management
  const [createDepartmentDialog, setCreateDepartmentDialog] = useState(false);
  const [editDepartmentDialog, setEditDepartmentDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    leadId: ''
  });

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="lg">
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

  // Status color function removed - no longer needed in admin panel

  const TabPanel = ({ children, value, index }) => {
    return (
      <div hidden={value !== index}>
        {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
      </div>
    );
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography 
          variant="h3" 
          fontWeight="700" 
          gutterBottom
          sx={{ 
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Admin Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Manage requests, users, and system settings
        </Typography>
      </Box>
      
      {/* Tabs */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: '16px' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ px: 2 }}
        >
          <Tab 
            icon={<People />} 
            label="User Management" 
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            icon={<Business />} 
            label="Department Management" 
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            icon={<Analytics />} 
            label="Analytics & Reports" 
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            icon={<Settings />} 
            label="System Settings" 
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>
      </Card>

      {/* Obsolete requests tab removed - admin no longer manages requests directly */}
      
      {/* User Management Tab */}
      <TabPanel value={activeTab} index={0}>
        {/* User Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ backgroundColor: theme.palette.primary.main }}>
                    <People />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Users
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {userStats?.total || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ backgroundColor: theme.palette.success.main }}>
                    <ToggleOn />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Active Users
                    </Typography>
                    <Typography variant="h4" color="success.main" fontWeight={700}>
                      {userStats?.active || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ backgroundColor: theme.palette.warning.main }}>
                    <AdminPanelSettings />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Admins
                    </Typography>
                    <Typography variant="h4" color="warning.main" fontWeight={700}>
                      {userStats?.admins || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ backgroundColor: theme.palette.info.main }}>
                    <People />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Regular Users
                    </Typography>
                    <Typography variant="h4" color="info.main" fontWeight={700}>
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
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                  <FilterList />
                </Avatar>
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
              <Grid item xs={12} sm={6} md={3}>
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                  <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
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
        </Card>
      </TabPanel>
      
      {/* Department Management Tab */}
      <TabPanel value={activeTab} index={1}>
        {/* Department Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Lead</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Employees</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
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
        </Card>
      </TabPanel>
      
      {/* Analytics & Reports Tab */}
      <TabPanel value={activeTab} index={2}>
        <Typography variant="h5" gutterBottom>
          Analytics & Reports
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          View comprehensive analytics, generate reports, and track system performance.
        </Typography>
        
        {/* Coming Soon Card */}
        <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, textAlign: 'center', py: 6 }}>
          <CardContent>
            <Analytics sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Analytics & Reports Coming Soon
            </Typography>
            <Typography variant="body2" color="text.disabled">
              This feature will provide detailed analytics on requests, user activity, and system performance.
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* System Settings Tab */}
      <TabPanel value={activeTab} index={3}>
        <Typography variant="h5" gutterBottom>
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Configure system-wide settings, email templates, and application preferences.
        </Typography>
        
        {/* Coming Soon Card */}
        <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, textAlign: 'center', py: 6 }}>
          <CardContent>
            <Settings sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              System Settings Coming Soon
            </Typography>
            <Typography variant="body2" color="text.disabled">
              This feature will allow you to configure email settings, notification preferences, and system defaults.
            </Typography>
          </CardContent>
        </Card>
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
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
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