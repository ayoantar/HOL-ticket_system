import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
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
  Card,
  CardContent,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  IconButton,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  Fade,
  Skeleton
} from '@mui/material';
import {
  Assignment,
  PersonAdd,
  Visibility,
  Edit,
  Schedule,
  TrendingUp,
  CheckCircle,
  Queue,
  Work,
  Info,
  Build,
  People
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';

const LeadDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();
  
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignedTo, setAssignedTo] = useState('');
  const [filters, setFilters] = useState({ status: '' });

  // Redirect if not lead
  if (user?.role !== 'lead') {
    return (
      <Container maxWidth="lg">
        <Typography variant="h4" color="error">
          Access Denied - Lead Only
        </Typography>
      </Container>
    );
  }

  // Fetch department tickets
  const { data: tickets, isLoading: ticketsLoading, refetch } = useQuery(
    ['lead-tickets', filters],
    async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      const response = await axios.get(`${API_BASE_URL}/tickets/lead/tickets?${params}`);
      return response.data.tickets;
    }
  );

  // Fetch department employees
  const { data: employees } = useQuery(
    'department-employees',
    async () => {
      const response = await axios.get(`${API_BASE_URL}/departments/${user.department}/employees`);
      return response.data.employees;
    }
  );

  const assignTicketMutation = useMutation(
    async ({ ticketId, assignedTo }) => {
      const response = await axios.post(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
        assignedTo,
        department: user.department
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Ticket assigned successfully!');
        setAssignDialogOpen(false);
        setSelectedTicket(null);
        setAssignedTo('');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to assign ticket');
      }
    }
  );

  const updateStatusMutation = useMutation(
    async ({ ticketId, status }) => {
      const response = await axios.put(`${API_BASE_URL}/tickets/${ticketId}`, { status });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Status updated successfully!');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update status');
      }
    }
  );

  const handleAssignTicket = () => {
    if (!assignedTo) {
      toast.error('Please select an employee');
      return;
    }
    assignTicketMutation.mutate({ ticketId: selectedTicket.id, assignedTo });
  };

  const handleStatusChange = (ticket, newStatus) => {
    updateStatusMutation.mutate({ ticketId: ticket.id, status: newStatus });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'info',
      'in-queue': 'secondary',
      'working-on-ticket': 'primary',
      'need-more-info': 'warning',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const getStats = () => {
    if (!tickets) return { total: 0, pending: 0, inQueue: 0, working: 0, completed: 0 };
    
    return {
      total: tickets.length,
      pending: tickets.filter(t => t.status === 'pending').length,
      inQueue: tickets.filter(t => t.status === 'in-queue').length,
      working: tickets.filter(t => t.status === 'working-on-ticket').length,
      completed: tickets.filter(t => t.status === 'completed').length
    };
  };

  const stats = getStats();

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
          Lead Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {user.department} Department - Welcome {user.name}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={300}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ backgroundColor: theme.palette.primary.main }}>
                    <Assignment />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Tickets
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.total}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={400}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ backgroundColor: theme.palette.warning.main }}>
                    <Schedule />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Pending
                    </Typography>
                    <Typography variant="h4" color="warning.main" fontWeight={700}>
                      {stats.pending}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={500}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ backgroundColor: theme.palette.info.main }}>
                    <Work />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      In Progress
                    </Typography>
                    <Typography variant="h4" color="primary.main" fontWeight={700}>
                      {stats.inQueue + stats.working}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={600}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ backgroundColor: theme.palette.success.main }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Completed
                    </Typography>
                    <Typography variant="h4" color="success.main" fontWeight={700}>
                      {stats.completed}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Typography variant="h6" fontWeight={600}>
                Filter Tickets
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in-queue">In Queue</MenuItem>
                <MenuItem value="working-on-ticket">Working on Ticket</MenuItem>
                <MenuItem value="need-more-info">Need More Info</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Typography variant="h6" fontWeight={600}>
            Department Tickets
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                <TableCell sx={{ fontWeight: 600 }}>Ticket #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Event Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ticketsLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={150} /></TableCell>
                    <TableCell><Skeleton width={200} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={150} /></TableCell>
                  </TableRow>
                ))
              ) : tickets?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 4 }}>
                      <Assignment sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No tickets found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                tickets?.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {ticket.ticketNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {ticket.client?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ticket.client?.company}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {ticket.eventName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.status}
                        color={getStatusColor(ticket.status)}
                        size="small"
                        sx={{ borderRadius: '8px', fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      {ticket.assignedUser ? (
                        <Typography variant="body2">
                          {ticket.assignedUser.name}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Unassigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          sx={{ color: theme.palette.primary.main }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setAssignDialogOpen(true);
                          }}
                          sx={{ color: theme.palette.warning.main }}
                        >
                          <PersonAdd fontSize="small" />
                        </IconButton>
                        <TextField
                          select
                          size="small"
                          value={ticket.status}
                          onChange={(e) => handleStatusChange(ticket, e.target.value)}
                          sx={{ minWidth: 120 }}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="in-queue">In Queue</MenuItem>
                          <MenuItem value="working-on-ticket">Working</MenuItem>
                          <MenuItem value="need-more-info">Need Info</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                        </TextField>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Assign Ticket Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ backgroundColor: theme.palette.primary.main }}>
              <PersonAdd />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Assign Ticket
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Ticket: {selectedTicket.ticketNumber} - {selectedTicket.eventName}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Assign to Employee</InputLabel>
                <Select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  label="Assign to Employee"
                >
                  {employees?.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <People fontSize="small" />
                        <span>{employee.name} ({employee.role})</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAssignDialogOpen(false)} sx={{ borderRadius: '12px' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignTicket} 
            variant="contained"
            disabled={assignTicketMutation.isLoading || !assignedTo}
            sx={{ borderRadius: '12px', fontWeight: 600 }}
          >
            {assignTicketMutation.isLoading ? 'Assigning...' : 'Assign Ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LeadDashboard;