import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import { 
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Info as InfoIcon,
  TrendingUp as EscalateIcon,
  Save as SaveIcon,
  NoteAdd as NoteIcon
} from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const TechStatusUpdate = ({ ticket }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusForm, setStatusForm] = useState({
    status: ticket?.status || '',
    notes: '',
    timeSpent: ''
  });
  const [noteForm, setNoteForm] = useState({
    notes: '',
    timeSpent: ''
  });
  const [activityForm, setActivityForm] = useState({
    activityType: '',
    notes: '',
    timeSpent: ''
  });
  const [alert, setAlert] = useState(null);

  // Check if user is tech and can update this ticket
  const canUpdateTicket = user && (user.role === 'employee' || user.role === 'lead') && 
    (ticket?.assignedTo === user.id || (user.role === 'lead' && ticket?.department === user.department));

  const statusUpdateMutation = useMutation(
    (data) => axios.put(`${API_BASE_URL}/tech/tickets/${ticket.id}/status`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['ticket', ticket.id]);
        queryClient.invalidateQueries(['tech-activities', ticket.id]);
        setStatusForm({ status: ticket.status, notes: '', timeSpent: '' });
        setAlert({ type: 'success', message: 'Status updated successfully!' });
      },
      onError: (error) => {
        setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to update status' });
      }
    }
  );

  const addNoteMutation = useMutation(
    (data) => axios.post(`${API_BASE_URL}/tech/tickets/${ticket.id}/internal-note`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tech-activities', ticket.id]);
        setNoteForm({ notes: '', timeSpent: '' });
        setAlert({ type: 'success', message: 'Internal note added successfully!' });
      },
      onError: (error) => {
        setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to add note' });
      }
    }
  );

  const logActivityMutation = useMutation(
    (data) => axios.post(`${API_BASE_URL}/tech/tickets/${ticket.id}/activity`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tech-activities', ticket.id]);
        setActivityForm({ activityType: '', notes: '', timeSpent: '' });
        setAlert({ type: 'success', message: 'Activity logged successfully!' });
      },
      onError: (error) => {
        setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to log activity' });
      }
    }
  );

  const handleStatusUpdate = () => {
    if (!statusForm.status) {
      setAlert({ type: 'error', message: 'Please select a status' });
      return;
    }
    statusUpdateMutation.mutate(statusForm);
  };

  const handleAddNote = () => {
    if (!noteForm.notes.trim()) {
      setAlert({ type: 'error', message: 'Please enter a note' });
      return;
    }
    addNoteMutation.mutate(noteForm);
  };

  const handleLogActivity = () => {
    if (!activityForm.activityType) {
      setAlert({ type: 'error', message: 'Please select an activity type' });
      return;
    }
    logActivityMutation.mutate(activityForm);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'approved': 'info',
      'in-queue': 'secondary',
      'working-on-ticket': 'primary',
      'need-more-info': 'warning',
      'completed': 'success',
      'cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  const getActivityIcon = (type) => {
    const icons = {
      'work_started': <StartIcon />,
      'work_completed': <StopIcon />,
      'info_requested': <InfoIcon />,
      'escalated': <EscalateIcon />
    };
    return icons[type] || <InfoIcon />;
  };

  if (!canUpdateTicket) {
    return (
      <Alert severity="info">
        You can only update status for tickets assigned to you.
      </Alert>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Tech Actions
        </Typography>
        
        {alert && (
          <Alert 
            severity={alert.type} 
            sx={{ mb: 2 }}
            onClose={() => setAlert(null)}
          >
            {alert.message}
          </Alert>
        )}

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            Current Status: 
            <Chip 
              label={ticket?.status} 
              color={getStatusColor(ticket?.status)} 
              size="small" 
              sx={{ ml: 1 }}
            />
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Status Update Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Update Status
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>New Status</InputLabel>
              <Select
                value={statusForm.status}
                label="New Status"
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="in-queue">In Queue</MenuItem>
                <MenuItem value="working-on-ticket">Working on Ticket</MenuItem>
                <MenuItem value="need-more-info">Need More Info</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Status Notes"
              multiline
              rows={2}
              value={statusForm.notes}
              onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Time Spent (minutes)"
              type="number"
              value={statusForm.timeSpent}
              onChange={(e) => setStatusForm({ ...statusForm, timeSpent: e.target.value })}
              margin="normal"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleStatusUpdate}
              disabled={statusUpdateMutation.isLoading}
              startIcon={<SaveIcon />}
              sx={{ mt: 1 }}
            >
              Update Status
            </Button>
          </Grid>

          {/* Internal Note Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Add Internal Note
            </Typography>
            <TextField
              fullWidth
              label="Internal Note"
              multiline
              rows={3}
              value={noteForm.notes}
              onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
              margin="normal"
              helperText="Internal notes are only visible to technicians"
            />
            <TextField
              fullWidth
              label="Time Spent (minutes)"
              type="number"
              value={noteForm.timeSpent}
              onChange={(e) => setNoteForm({ ...noteForm, timeSpent: e.target.value })}
              margin="normal"
            />
            <Button
              variant="outlined"
              color="primary"
              onClick={handleAddNote}
              disabled={addNoteMutation.isLoading}
              startIcon={<NoteIcon />}
              sx={{ mt: 1 }}
            >
              Add Note
            </Button>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<StartIcon />}
                onClick={() => setActivityForm({ ...activityForm, activityType: 'work_started' })}
                size="small"
              >
                Start Work
              </Button>
              <Button
                variant="outlined"
                startIcon={<StopIcon />}
                onClick={() => setActivityForm({ ...activityForm, activityType: 'work_completed' })}
                size="small"
              >
                Complete Work
              </Button>
              <Button
                variant="outlined"
                startIcon={<InfoIcon />}
                onClick={() => setActivityForm({ ...activityForm, activityType: 'info_requested' })}
                size="small"
              >
                Request Info
              </Button>
              <Button
                variant="outlined"
                startIcon={<EscalateIcon />}
                onClick={() => setActivityForm({ ...activityForm, activityType: 'escalated' })}
                size="small"
              >
                Escalate
              </Button>
            </Box>
            
            {activityForm.activityType && (
              <Box mt={2}>
                <TextField
                  fullWidth
                  label="Activity Notes"
                  multiline
                  rows={2}
                  value={activityForm.notes}
                  onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Time Spent (minutes)"
                  type="number"
                  value={activityForm.timeSpent}
                  onChange={(e) => setActivityForm({ ...activityForm, timeSpent: e.target.value })}
                  margin="normal"
                />
                <Box mt={1}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleLogActivity}
                    disabled={logActivityMutation.isLoading}
                    startIcon={getActivityIcon(activityForm.activityType)}
                    sx={{ mr: 1 }}
                  >
                    Log Activity
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setActivityForm({ activityType: '', notes: '', timeSpent: '' })}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default TechStatusUpdate;