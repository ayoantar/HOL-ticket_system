import React from 'react';
import {
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Divider,
  Button
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { API_BASE_URL } from '../config/api';

const NotificationPanel = ({ open, onClose }) => {
  const { data: notifications } = useQuery(
    'notifications',
    async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`);
      return response.data.notifications;
    },
    { enabled: open }
  );

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/read-all`);
      // Refetch notifications or update state
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          maxWidth: '90vw'
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Notifications</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>
      <Divider />
      
      {notifications && notifications.length > 0 && (
        <Box sx={{ p: 2 }}>
          <Button 
            size="small" 
            onClick={markAllAsRead}
            variant="outlined"
            fullWidth
          >
            Mark All as Read
          </Button>
        </Box>
      )}

      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <ListItem
              key={notification.id}
              sx={{
                backgroundColor: notification.read ? 'transparent' : 'action.hover'
              }}
            >
              <ListItemText
                primary={notification.title}
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText
              primary="No notifications"
              secondary="You're all caught up!"
            />
          </ListItem>
        )}
      </List>
    </Drawer>
  );
};

export default NotificationPanel;