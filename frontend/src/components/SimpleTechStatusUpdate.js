import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  Alert,
  Paper,
  LinearProgress,
  IconButton,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Info as InfoIcon,
  CheckCircle as CompleteIcon,
  AccessTime as TimeIcon,
  Note as NoteIcon,
  Pause as PauseIcon
} from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const SimpleTechStatusUpdate = ({ ticket }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [quickNote, setQuickNote] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [alert, setAlert] = useState(null);
  const [swipeAction, setSwipeAction] = useState(null);
  const cardRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  // Check if user can update this ticket
  const canUpdateTicket = user && (
    user.role === 'admin' || 
    (user.role === 'employee' && ticket?.assignedTo === user.id) || 
    (user.role === 'lead' && ticket?.department === user.department)
  );

  // Debug logging (remove this in production)
  // console.log('SimpleTechStatusUpdate Debug:', {
  //   user: user ? { id: user.id, role: user.role, department: user.department } : null,
  //   ticket: ticket ? { id: ticket.id, assignedTo: ticket.assignedTo, department: ticket.department } : null,
  //   canUpdateTicket
  // });

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current || !isMobile) return;
    currentX.current = e.touches[0].clientX;
    currentY.current = e.touches[0].clientY;
    
    const deltaX = currentX.current - startX.current;
    const deltaY = Math.abs(currentY.current - startY.current);
    
    // Only process horizontal swipes
    if (deltaY > 50) {
      isDragging.current = false;
      return;
    }
    
    // Visual feedback for swipe
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        setSwipeAction('start-work');
      } else {
        setSwipeAction('complete');
      }
    } else {
      setSwipeAction(null);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || !isMobile) return;
    
    const deltaX = currentX.current - startX.current;
    const deltaY = Math.abs(currentY.current - startY.current);
    
    // Only process horizontal swipes with minimal vertical movement
    if (deltaY < 50 && Math.abs(deltaX) > 100) {
      if (deltaX > 0 && ticket?.status !== 'in_progress') {
        // Swipe right - start work
        handleStartWork();
      } else if (deltaX < 0 && ticket?.status === 'in_progress') {
        // Swipe left - complete work
        handleCompleteWork();
      }
    }
    
    isDragging.current = false;
    setSwipeAction(null);
  };

  // Status update mutation
  const statusUpdateMutation = useMutation(
    (data) => axios.put(`${API_BASE_URL}/requests/${ticket.id}/status`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['request', ticket.id]);
        queryClient.invalidateQueries(['tech-activities', ticket.id]);
        setAlert({ type: 'success', message: 'Status updated successfully!' });
        setQuickNote('');
      },
      onError: (error) => {
        console.log('Status update error:', error.response?.data);
        setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to update status' });
      }
    }
  );

  const handleStatusChange = (newStatus, autoNote = '') => {
    const data = {
      status: newStatus,
      notes: quickNote || autoNote,
      timeSpent: timeSpent || null
    };
    
    console.log('Sending status update:', {
      url: `${API_BASE_URL}/requests/${ticket.id}/status`,
      data,
      user: user ? { id: user.id, role: user.role } : null
    });
    
    statusUpdateMutation.mutate(data);
    
    // Stop timer if completing work
    if (newStatus === 'completed' && isTimerRunning) {
      setIsTimerRunning(false);
    }
  };

  const handleStartWork = () => {
    setIsTimerRunning(true);
    handleStatusChange('in_progress', 'Work started');
  };

  const handleCompleteWork = () => {
    setIsTimerRunning(false);
    handleStatusChange('completed', 'Work completed');
  };

  const handlePutOnHold = () => {
    handleStatusChange('on_hold', 'Request put on hold');
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ff9800',
      'in_progress': '#4caf50',
      'completed': '#8bc34a',
      'cancelled': '#f44336',
      'on_hold': '#ff5722'
    };
    return colors[status] || '#757575';
  };

  const getNextActions = () => {
    const status = ticket?.status;
    switch (status) {
      case 'pending':
        return [
          { label: 'Start Work', icon: <StartIcon />, action: handleStartWork, color: 'success' }
        ];
      case 'in_progress':
        return [
          { label: 'Complete', icon: <CompleteIcon />, action: handleCompleteWork, color: 'success' },
          { label: 'Put On Hold', icon: <PauseIcon />, action: handlePutOnHold, color: 'warning' }
        ];
      case 'on_hold':
        return [
          { label: 'Resume Work', icon: <StartIcon />, action: handleStartWork, color: 'primary' },
          { label: 'Complete', icon: <CompleteIcon />, action: handleCompleteWork, color: 'success' }
        ];
      default:
        return [];
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!canUpdateTicket) {
    return (
      <Alert severity="info">
        You can only update status for tickets assigned to you.
      </Alert>
    );
  }

  const nextActions = getNextActions();

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      {alert && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 2 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      {/* Ticket Status Card */}
      <Card 
        ref={cardRef}
        sx={{ 
          mb: 3, 
          border: `3px solid ${getStatusColor(ticket?.status)}`,
          transform: swipeAction ? 'scale(0.98)' : 'scale(1)',
          transition: 'transform 0.2s ease',
          bgcolor: swipeAction === 'start-work' ? 'success.light' : 
                   swipeAction === 'complete' ? 'warning.light' : 'background.paper',
          opacity: swipeAction ? 0.8 : 1,
          cursor: isMobile ? 'grab' : 'default'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2">
              {ticket?.ticketNumber}
            </Typography>
            <Chip 
              label={ticket?.status?.replace('-', ' ').toUpperCase()} 
              sx={{ 
                bgcolor: getStatusColor(ticket?.status),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>
          
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {ticket?.title}
          </Typography>

          {/* Time Tracking */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <TimeIcon color="action" />
              <Typography variant="body2">
                {formatTime(timeSpent)} 
              </Typography>
              {isTimerRunning && <Chip label="ACTIVE" color="success" size="small" sx={{ ml: 1 }} />}
            </Box>
            
            {ticket?.status === 'in_progress' && (
              <IconButton 
                onClick={toggleTimer}
                color={isTimerRunning ? 'error' : 'success'}
                size="small"
              >
                {isTimerRunning ? <PauseIcon /> : <StartIcon />}
              </IconButton>
            )}
          </Box>

          {isTimerRunning && (
            <LinearProgress 
              variant="indeterminate" 
              sx={{ mb: 2, height: 6, borderRadius: 3 }}
              color="success"
            />
          )}

          {/* Mobile swipe hint */}
          {isMobile && (
            <Box textAlign="center" mt={2}>
              <Typography variant="caption" color="text.secondary">
                {ticket?.status === 'in_progress' 
                  ? '← Swipe left to complete or use buttons below'
                  : '→ Swipe right to start work or use buttons below'
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {nextActions.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {nextActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Button
                  variant="contained"
                  color={action.color}
                  startIcon={action.icon}
                  onClick={action.action}
                  disabled={statusUpdateMutation.isLoading}
                  fullWidth
                  size="large"
                  sx={{ py: 1.5, fontSize: '1rem' }}
                >
                  {action.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Quick Note */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Add Quick Note
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={quickNote}
          onChange={(e) => setQuickNote(e.target.value)}
          placeholder="Add a quick note about your work..."
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button
          variant="outlined"
          startIcon={<NoteIcon />}
          onClick={() => {
            if (quickNote.trim()) {
              handleStatusChange(ticket?.status, quickNote);
            }
          }}
          disabled={!quickNote.trim() || statusUpdateMutation.isLoading}
        >
          Add Note
        </Button>
      </Box>
    </Paper>
  );
};

export default SimpleTechStatusUpdate;