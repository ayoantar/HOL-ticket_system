import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Info as InfoIcon,
  TrendingUp as EscalateIcon,
  Edit as StatusIcon,
  Note as NoteIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const TechActivityLog = ({ ticketId }) => {
  const { user } = useAuth();
  const [showInternal, setShowInternal] = useState(false);

  const { data: activities, isLoading, error } = useQuery(
    ['tech-activities', ticketId, showInternal],
    () => axios.get(`${API_BASE_URL}/tech/tickets/${ticketId}/activities?includeInternal=${showInternal}`).then(res => res.data.activities),
    {
      enabled: !!ticketId
    }
  );

  const getActivityIcon = (type) => {
    const icons = {
      'status_change': <StatusIcon />,
      'internal_note': <NoteIcon />,
      'work_started': <StartIcon />,
      'work_completed': <StopIcon />,
      'info_requested': <InfoIcon />,
      'escalated': <EscalateIcon />
    };
    return icons[type] || <InfoIcon />;
  };

  const getActivityColor = (type) => {
    const colors = {
      'status_change': 'primary',
      'internal_note': 'secondary',
      'work_started': 'success',
      'work_completed': 'success',
      'info_requested': 'warning',
      'escalated': 'error'
    };
    return colors[type] || 'default';
  };

  const getActivityTitle = (activity) => {
    const titles = {
      'status_change': `Status changed from ${activity.oldStatus} to ${activity.newStatus}`,
      'internal_note': 'Internal note added',
      'work_started': 'Work started',
      'work_completed': 'Work completed',
      'info_requested': 'Information requested',
      'escalated': 'Ticket escalated'
    };
    return titles[activity.activityType] || 'Activity logged';
  };

  const canViewInternal = user && (user.role === 'admin' || user.role === 'lead' || user.role === 'employee');

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading activity log. Please try again.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Activity Log
          </Typography>
          {canViewInternal && (
            <FormControlLabel
              control={
                <Switch
                  checked={showInternal}
                  onChange={(e) => setShowInternal(e.target.checked)}
                  size="small"
                />
              }
              label="Show Internal"
            />
          )}
        </Box>

        {!activities || activities.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" py={3}>
            No activities logged yet.
          </Typography>
        ) : (
          <List>
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                  <ListItemIcon>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: `${getActivityColor(activity.activityType)}.main` 
                      }}
                    >
                      {getActivityIcon(activity.activityType)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="subtitle2" component="h3">
                            {getActivityTitle(activity)}
                          </Typography>
                          <Box display="flex" gap={1}>
                            {activity.isInternal && (
                              <Chip 
                                label="Internal" 
                                size="small" 
                                color="secondary" 
                                variant="outlined"
                              />
                            )}
                            {activity.timeSpent && (
                              <Chip 
                                label={`${activity.timeSpent}min`} 
                                size="small" 
                                icon={<TimeIcon />}
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                        
                        {activity.notes && (
                          <Typography variant="body2" color="text.secondary" mb={1}>
                            {activity.notes}
                          </Typography>
                        )}
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {activity.tech?.name} • {activity.tech?.department}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < activities.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default TechActivityLog;