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
  Stack,
  IconButton,
  useTheme,
  alpha,
  TextField,
  MenuItem,
  Fade,
  Skeleton
} from '@mui/material';
import {
  Assignment,
  Visibility,
  Schedule,
  Work,
  CheckCircle,
  PlayArrow,
  Pause,
  Stop,
  Info,
  Person
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({ status: '' });

  // Redirect if not employee
  if (user?.role !== 'employee') {
    return (
      <Container maxWidth="lg">
        <Typography variant="h4" color="error">
          Access Denied - Employee Only
        </Typography>
      </Container>
    );
  }

  // Fetch my tickets
  const { data: tickets, isLoading: ticketsLoading, refetch } = useQuery(
    ['my-tickets', filters],
    async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      const response = await axios.get(`${API_BASE_URL}/tickets/my/tickets?${params}`);
      return response.data.tickets;
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

  const getStatusIcon = (status) => {
    const icons = {
      'in-queue': <Schedule />,
      'working-on-ticket': <Work />,
      'need-more-info': <Info />,
      'completed': <CheckCircle />
    };
    return icons[status] || <Assignment />;
  };

  const getStats = () => {
    if (!tickets) return { total: 0, inQueue: 0, working: 0, needInfo: 0, completed: 0 };
    
    return {
      total: tickets.length,
      inQueue: tickets.filter(t => t.status === 'in-queue').length,
      working: tickets.filter(t => t.status === 'working-on-ticket').length,
      needInfo: tickets.filter(t => t.status === 'need-more-info').length,
      completed: tickets.filter(t => t.status === 'completed').length
    };
  };

  const stats = getStats();

  const getActionButton = (ticket) => {
    switch (ticket.status) {
      case 'in-queue':
        return (
          <Button
            size="small"
            startIcon={<PlayArrow />}
            onClick={() => handleStatusChange(ticket, 'working-on-ticket')}
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Start Work
          </Button>
        );
      case 'working-on-ticket':
        return (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={<Info />}
              onClick={() => handleStatusChange(ticket, 'need-more-info')}
              color="warning"
              sx={{ borderRadius: '8px', textTransform: 'none' }}
            >
              Need Info
            </Button>
            <Button
              size="small"
              startIcon={<CheckCircle />}
              onClick={() => handleStatusChange(ticket, 'completed')}
              color="success"
              sx={{ borderRadius: '8px', textTransform: 'none' }}
            >
              Complete
            </Button>
          </Stack>
        );
      case 'need-more-info':
        return (
          <Button
            size="small"
            startIcon={<PlayArrow />}
            onClick={() => handleStatusChange(ticket, 'working-on-ticket')}
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Resume Work
          </Button>
        );
      default:
        return null;
    }
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
          My Tickets
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Welcome {user.name} - {user.department} Department
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
                      Total Assigned
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
                  <Avatar sx={{ backgroundColor: theme.palette.secondary.main }}>
                    <Schedule />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      In Queue
                    </Typography>
                    <Typography variant="h4" color="secondary.main" fontWeight={700}>
                      {stats.inQueue}
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
                  <Avatar sx={{ backgroundColor: theme.palette.primary.main }}>
                    <Work />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Working On
                    </Typography>
                    <Typography variant="h4" color="primary.main" fontWeight={700}>
                      {stats.working}
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
                Filter My Tickets
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
            My Assigned Tickets
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                <TableCell sx={{ fontWeight: 600 }}>Ticket #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Event Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Event Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Assigned By</TableCell>
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
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={150} /></TableCell>
                  </TableRow>
                ))
              ) : tickets?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 4 }}>
                      <Assignment sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No tickets assigned
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        You don't have any tickets assigned to you yet
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
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(ticket.startDate), 'MMM dd, yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(ticket.status)}
                        label={ticket.status}
                        color={getStatusColor(ticket.status)}
                        size="small"
                        sx={{ borderRadius: '8px', fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {ticket.assignedByUser?.name || 'System'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          sx={{ color: theme.palette.primary.main }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        {getActionButton(ticket)}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  );
};

export default EmployeeDashboard;