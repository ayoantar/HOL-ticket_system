import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Snackbar } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import TechStatusUpdate from '../components/TechStatusUpdate';
import SimpleTechStatusUpdate from '../components/SimpleTechStatusUpdate';
import TechActivityLog from '../components/TechActivityLog';

const TicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { data: ticket, isLoading, error } = useQuery(
    ['ticket', id],
    async () => {
      const response = await axios.get(`${API_BASE_URL}/tickets/${id}`);
      return response.data.ticket;
    }
  );

  const updateTicketMutation = useMutation(
    (updatedData) => axios.put(`${API_BASE_URL}/tickets/${id}`, updatedData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['ticket', id]);
        setIsEditing(false);
        setSnackbar({ open: true, message: 'Ticket updated successfully!', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.message || 'Failed to update ticket', 
          severity: 'error' 
        });
      }
    }
  );

  const canEdit = user && (user.role === 'admin' || user.role === 'lead');
  const isTech = user && (user.role === 'employee' || user.role === 'lead');
  const canTechUpdate = user && (
    user.role === 'admin' || 
    (user.role === 'employee' && ticket?.assignedTo === user.id) || 
    (user.role === 'lead' && ticket?.department === user.department)
  );

  const handleEditClick = () => {
    setEditForm({
      eventName: ticket?.eventName || '',
      eventType: ticket?.eventType || '',
      description: ticket?.description || '',
      startDate: ticket?.startDate ? ticket.startDate.split('T')[0] : '',
      endDate: ticket?.endDate ? ticket.endDate.split('T')[0] : '',
      venue: ticket?.venue || '',
      attendeeCount: ticket?.attendeeCount || '',
      additionalRequirements: ticket?.additionalRequirements || '',
      status: ticket?.status || 'pending',
      priority: ticket?.priority || 'medium'
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedData = { ...editForm };
    
    // Convert dates to ISO format
    if (updatedData.startDate) {
      updatedData.startDate = new Date(updatedData.startDate).toISOString();
    }
    if (updatedData.endDate) {
      updatedData.endDate = new Date(updatedData.endDate).toISOString();
    }
    
    // Convert attendeeCount to number
    if (updatedData.attendeeCount) {
      updatedData.attendeeCount = parseInt(updatedData.attendeeCount, 10);
    }
    
    updateTicketMutation.mutate(updatedData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'info',
      'in-progress': 'primary',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error'
    };
    return colors[priority] || 'default';
  };

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">
          Error loading ticket details. Please try again.
        </Alert>
      </Container>
    );
  }


  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4 }}>
        <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom>
              Ticket Details
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {ticket?.ticketNumber}
            </Typography>
          </Box>
          {canEdit && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEditClick}
              disabled={updateTicketMutation.isLoading}
            >
              Edit Ticket Details
            </Button>
          )}
        </Box>

        {/* Tech Status Update Section - Only for assigned techs */}
        {/* Temporarily disabled: {canTechUpdate && (
          <SimpleTechStatusUpdate ticket={ticket} />
        )} */}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Event Information</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Event Name" secondary={ticket?.eventName} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Event Type" secondary={ticket?.eventType} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Venue" secondary={ticket?.venue} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Expected Attendees" secondary={ticket?.attendeeCount} />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Start Date" 
                  secondary={ticket?.startDate ? format(new Date(ticket.startDate), 'PPP p') : 'N/A'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="End Date" 
                  secondary={ticket?.endDate ? format(new Date(ticket.endDate), 'PPP p') : 'N/A'} 
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Status & Priority</Typography>
            <Box mb={2}>
              <Chip
                label={ticket?.status}
                color={getStatusColor(ticket?.status)}
                sx={{ mr: 1, mb: 1 }}
              />
              <Chip
                label={ticket?.priority}
                color={getPriorityColor(ticket?.priority)}
                sx={{ mb: 1 }}
              />
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Client Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Name" secondary={ticket?.client?.name} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Email" secondary={ticket?.client?.email} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Company" secondary={ticket?.client?.company || 'N/A'} />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Description</Typography>
            <Typography variant="body1" paragraph>
              {ticket?.description}
            </Typography>

            {ticket?.additionalRequirements && (
              <>
                <Typography variant="h6" gutterBottom>Additional Requirements</Typography>
                <Typography variant="body1" paragraph>
                  {ticket.additionalRequirements}
                </Typography>
              </>
            )}

            {ticket?.equipment && ticket.equipment.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>Required Equipment</Typography>
                <Box>
                  {ticket.equipment.map((item) => (
                    <Chip 
                      key={item.id} 
                      label={`${item.name} (${item.category})`} 
                      sx={{ mr: 1, mb: 1 }} 
                    />
                  ))}
                </Box>
              </>
            )}

            {ticket?.presentationFilename && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Uploaded Files
                </Typography>
                <Typography variant="body2">
                  📎 {ticket.presentationFilename}
                </Typography>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Tech Activity Log - Visible to all authenticated users */}
      {user && (
        <Box mt={3}>
          <TechActivityLog ticketId={id} />
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditing} onClose={handleCancel} maxWidth="md" fullWidth>
        <DialogTitle>Edit Ticket</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Event Name"
                value={editForm.eventName || ''}
                onChange={(e) => handleFormChange('eventName', e.target.value)}
                margin="normal"
                disabled={user?.role === 'lead'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={editForm.eventType || ''}
                  label="Event Type"
                  onChange={(e) => handleFormChange('eventType', e.target.value)}
                  disabled={user?.role === 'lead'}
                >
                  <MenuItem value="presentation">Presentation</MenuItem>
                  <MenuItem value="conference">Conference</MenuItem>
                  <MenuItem value="workshop">Workshop</MenuItem>
                  <MenuItem value="seminar">Seminar</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Venue"
                value={editForm.venue || ''}
                onChange={(e) => handleFormChange('venue', e.target.value)}
                margin="normal"
                disabled={user?.role === 'lead'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expected Attendees"
                type="number"
                value={editForm.attendeeCount || ''}
                onChange={(e) => handleFormChange('attendeeCount', e.target.value)}
                margin="normal"
                disabled={user?.role === 'lead'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={editForm.startDate || ''}
                onChange={(e) => handleFormChange('startDate', e.target.value)}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                disabled={user?.role === 'lead'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={editForm.endDate || ''}
                onChange={(e) => handleFormChange('endDate', e.target.value)}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                disabled={user?.role === 'lead'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status || ''}
                  label="Status"
                  onChange={(e) => handleFormChange('status', e.target.value)}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={editForm.priority || ''}
                  label="Priority"
                  onChange={(e) => handleFormChange('priority', e.target.value)}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={editForm.description || ''}
                onChange={(e) => handleFormChange('description', e.target.value)}
                margin="normal"
                disabled={user?.role === 'lead'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Requirements"
                multiline
                rows={3}
                value={editForm.additionalRequirements || ''}
                onChange={(e) => handleFormChange('additionalRequirements', e.target.value)}
                margin="normal"
                disabled={user?.role === 'lead'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={updateTicketMutation.isLoading}
          >
            {updateTicketMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Container>
  );
};

export default TicketDetail;