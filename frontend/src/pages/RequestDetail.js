import React, { useState, useCallback, useEffect, memo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Chip,
  Card,
  CardContent,
  Stack,
  Alert,
  Skeleton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Avatar,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tooltip,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack,
  CalendarToday,
  Person,
  Email,
  Phone,
  Flag,
  Assignment,
  Send,
  AttachFile,
  Comment,
  Timeline,
  PlayArrow,
  CheckCircle,
  Pause,
  Refresh
} from '@mui/icons-material';
import { format, formatDistanceToNow, isAfter, subMinutes } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';


// Separate component for the message input to prevent re-renders
const MessageInput = memo(({ canEdit, onSubmit, isLoading }) => {
  const [message, setMessage] = useState('');
  
  const handleSubmit = () => {
    if (!message.trim()) return;
    onSubmit(message);
    setMessage('');
  };

  return (
    <Box sx={{ mb: 3 }}>
      {canEdit && (
        <Box sx={{ mb: 2 }}>
          <FormControl component="fieldset">
            <Stack direction="row" spacing={2}>
              <Button
                variant={message.startsWith('[INTERNAL]') ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {
                  if (!message.startsWith('[INTERNAL]')) {
                    setMessage('[INTERNAL] ' + message);
                  }
                }}
                color="secondary"
              >
                Internal Note
              </Button>
              <Button
                variant={!message.startsWith('[INTERNAL]') ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {
                  if (message.startsWith('[INTERNAL]')) {
                    setMessage(message.replace('[INTERNAL] ', ''));
                  }
                }}
                color="primary"
              >
                Client Message
              </Button>
            </Stack>
          </FormControl>
        </Box>
      )}
      <TextField
        key="message-input"
        fullWidth
        multiline
        rows={4}
        placeholder={canEdit ? 
          "Add a message or internal note..." : 
          "Send a message to the tech team..."
        }
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!message.trim() || isLoading}
        startIcon={<Send />}
      >
        {isLoading ? 'Sending...' : 'Send Message'}
      </Button>
    </Box>
  );
});

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile, isLargePhone, isIPhoneStyle, getContainerMaxWidth } = useResponsive();
  const queryClient = useQueryClient();
  
  // State for inline editing
  const [activeTab, setActiveTab] = useState(0);
  const [attachments, setAttachments] = useState([]);
  const [readMessages, setReadMessages] = useState(new Set());
  const firstUnreadRef = useRef(null);
  
  // Check if user can edit (tech roles)
  const canEdit = user && ['employee', 'dept_lead', 'admin'].includes(user.role);


  const { data, isLoading, error, refetch } = useQuery(
    ['request', id],
    async () => {
      const response = await axios.get(`${API_BASE_URL}/requests/${id}`);
      console.log('RequestDetail API response:', response.data);
      return response.data;
    },
    {
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // Poll every 30 seconds
      refetchIntervalInBackground: false // Only poll when tab is active
    }
  );

  // Query for comments with polling
  const { data: commentsData, isLoading: commentsLoading } = useQuery(
    ['comments', id],
    async () => {
      const response = await axios.get(`${API_BASE_URL}/requests/${id}/comments`);
      return response.data;
    },
    {
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // Poll every 30 seconds
      refetchIntervalInBackground: false // Only poll when tab is active
    }
  );

  // Extract request data from response
  const request = data?.request || data?.ticket;

  // Mark all messages as read when page loads
  useEffect(() => {
    if (commentsData?.comments) {
      const allMessageIds = commentsData.comments.map(comment => comment.id);
      setReadMessages(new Set(allMessageIds));
    }
  }, [commentsData?.comments]);

  // Mark messages as read when opening communication tab
  useEffect(() => {
    if (activeTab === 0 && request?.unreadCount > 0) {
      // Simple approach: refetch request data after a short delay to update unread count
      setTimeout(() => {
        refetch();
      }, 1000);
    }
  }, [activeTab, request?.unreadCount, refetch]);
  
  // Auto-scroll to first unread message when communication tab opens
  useEffect(() => {
    if (activeTab === 0 && firstUnreadRef.current) {
      setTimeout(() => {
        firstUnreadRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [activeTab, commentsData]);
  
  
  // Mutation for status updates
  const updateStatusMutation = useMutation(
    async (statusData) => {
      const response = await axios.put(`${API_BASE_URL}/requests/${id}/status`, statusData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Status updated successfully');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update status');
      }
    }
  );
  
  
  // Mutation for adding comments
  const addCommentMutation = useMutation(
    async (commentData) => {
      const response = await axios.post(`${API_BASE_URL}/requests/${id}/comments`, commentData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Message sent successfully');
        queryClient.invalidateQueries(['comments', id]);
      },
      onError: (error) => {
        console.error('Comment error:', error);
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
    }
  );

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

  const getRequestTypeLabel = (type) => {
    const labels = {
      event: 'New Event',
      web: 'Web Request',
      technical: 'Technical Issue',
      graphic: 'Graphic Design'
    };
    return labels[type] || type;
  };

  const formatTimestampWithNewIndicator = (timestamp) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const timeSinceLastVisit = subMinutes(now, 5); // Consider messages within 5 minutes as "new"
    
    const isRecentMessage = isAfter(messageDate, timeSinceLastVisit);
    const formattedTime = format(messageDate, 'MMM dd, yyyy hh:mm a');
    const relativeTime = formatDistanceToNow(messageDate, { addSuffix: true });
    
    return {
      formatted: formattedTime,
      relative: relativeTime,
      isRecent: isRecentMessage
    };
  };


  const handleSubmitMessage = useCallback((message) => {
    // Check if it's an internal note or client message
    let content = message.trim();
    let isInternal = false;
    
    if (content.startsWith('[INTERNAL]')) {
      content = content.replace('[INTERNAL] ', '');
      isInternal = true;
    } else if (canEdit) {
      // For tech users, default to client message unless marked internal
      isInternal = false;
    } else {
      // For clients, always non-internal
      isInternal = false;
    }
    
    addCommentMutation.mutate({
      content: content,
      isInternal: isInternal
    });
  }, [canEdit, addCommentMutation]);

  const handleMarkMessageAsRead = useCallback((messageId) => {
    setReadMessages(prev => new Set(prev).add(messageId));
  }, []);


  const handleQuickStatusUpdate = (newStatus, notes) => {
    updateStatusMutation.mutate({
      status: newStatus,
      notes: notes,
      timeSpent: null
    });
  };


  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setAttachments([...attachments, ...files]);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );

  const renderRequestDetails = () => {
    const request = data?.request || data?.ticket;
    if (!request) return null;
    
    switch (request.requestType || request.eventType) {
      case 'event':
      case 'presentation':
      case 'conference':
      case 'workshop':
      case 'seminar':
      case 'other':
        return (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Event Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Event Name</Typography>
                  <Typography variant="body1">{request.eventRequest?.eventName || request.eventName}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Ministry in Charge</Typography>
                  <Typography variant="body1">{request.eventRequest?.ministryInCharge || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Start Date</Typography>
                  <Typography variant="body1">
                    {request.eventRequest?.startingDate || request.startDate ? 
                      format(new Date(request.eventRequest?.startingDate || request.startDate), 'MMM dd, yyyy hh:mm a') : 
                      'Not specified'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">End Date</Typography>
                  <Typography variant="body1">
                    {request.eventRequest?.endingDate || request.endDate ? 
                      format(new Date(request.eventRequest?.endingDate || request.endDate), 'MMM dd, yyyy hh:mm a') : 
                      'Not specified'
                    }
                  </Typography>
                </Grid>
                {request.eventRequest?.cost && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Cost</Typography>
                    <Typography variant="body1">${request.eventRequest.cost}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Graphics Required</Typography>
                  <Typography variant="body1">
                    {request.eventRequest?.graphicRequired ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                {request.eventRequest?.equipmentNeeded && request.eventRequest.equipmentNeeded.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Equipment Needed</Typography>
                    <Box sx={{ mt: 1 }}>
                      {request.eventRequest.equipmentNeeded.map((equipment, index) => (
                        <Chip key={index} label={equipment} size="small" sx={{ mr: 1, mb: 1 }} />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        );
        
      case 'web':
        return (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Web Request Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Domain</Typography>
                  <Typography variant="body1">{request.webRequest?.domain}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{request.webRequest?.description}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
        
      case 'technical':
        return (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Technical Issue Details</Typography>
              <Grid container spacing={2}>
                {request.technicalRequest?.issueType && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Issue Type</Typography>
                    <Typography variant="body1">{request.technicalRequest.issueType}</Typography>
                  </Grid>
                )}
                {request.technicalRequest?.severity && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Severity</Typography>
                    <Typography variant="body1">{request.technicalRequest.severity}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Issue Description</Typography>
                  <Typography variant="body1">{request.technicalRequest?.issueDescription}</Typography>
                </Grid>
                {request.technicalRequest?.stepsToReproduce && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Steps to Reproduce</Typography>
                    <Typography variant="body1">{request.technicalRequest.stepsToReproduce}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        );
        
      case 'graphic':
        return (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Graphic Design Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Event/Project Name</Typography>
                  <Typography variant="body1">{request.graphicRequest?.eventName}</Typography>
                </Grid>
                {request.graphicRequest?.eventDate && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Event Date</Typography>
                    <Typography variant="body1">
                      {format(new Date(request.graphicRequest.eventDate), 'MMM dd, yyyy hh:mm a')}
                    </Typography>
                  </Grid>
                )}
                {request.graphicRequest?.specificFont && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Specific Font</Typography>
                    <Typography variant="body1">{request.graphicRequest.specificFont}</Typography>
                  </Grid>
                )}
                {request.graphicRequest?.colorPreference && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Color Preference</Typography>
                    <Typography variant="body1">{request.graphicRequest.colorPreference}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Previous Event</Typography>
                  <Typography variant="body1">
                    {request.graphicRequest?.isPreviousEvent ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                {request.graphicRequest?.reusableItems && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Reusable Items</Typography>
                    <Typography variant="body1">{request.graphicRequest.reusableItems}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        );
        
      default:
        return (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Ticket Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{request.description || 'No description provided'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Start Date</Typography>
                  <Typography variant="body1">
                    {request.startDate ? 
                      format(new Date(request.startDate), 'MMM dd, yyyy hh:mm a') : 
                      'Not specified'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">End Date</Typography>
                  <Typography variant="body1">
                    {request.endDate ? 
                      format(new Date(request.endDate), 'MMM dd, yyyy hh:mm a') : 
                      'Not specified'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Venue</Typography>
                  <Typography variant="body1">{request.venue || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Attendee Count</Typography>
                  <Typography variant="body1">{request.attendeeCount || 'Not specified'}</Typography>
                </Grid>
                {request.additionalRequirements && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Additional Requirements</Typography>
                    <Typography variant="body1">{request.additionalRequirements}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        );
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth={getContainerMaxWidth()} sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
        <Skeleton variant="rectangular" height={200} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth={getContainerMaxWidth()} sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
        <Alert severity="error">
          Error loading request details: {error.message}
        </Alert>
      </Container>
    );
  }

  if (!request) {
    return (
      <Container maxWidth={getContainerMaxWidth()} sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
        <Alert severity="error">
          Request not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={getContainerMaxWidth()} sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box mb={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Typography variant="h4">
                {request.requestNumber || request.ticketNumber}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                icon={<Assignment />}
                label={getRequestTypeLabel(request.requestType || request.eventType)}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={request.status}
                color={getStatusColor(request.status)}
                size="small"
              />
              <Chip
                icon={<Flag />}
                label={request.urgency || request.priority}
                color={getUrgencyColor(request.urgency || request.priority)}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => queryClient.invalidateQueries(['comments', id])}
              size="small"
            >
              Refresh Messages
            </Button>
          </Box>
        </Box>
      </Box>


      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {renderRequestDetails()}
          
          {/* Comments and Activity Section */}
          {(canEdit || user.role === 'user') && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                  <Tab icon={<Comment />} label={canEdit ? "Communication" : "Messages"} />
                  <Tab icon={<Timeline />} label="Activity" />
                  <Tab icon={<AttachFile />} label="Files" />
                </Tabs>
                
                <TabPanel value={activeTab} index={0}>
                  {/* Add Comment Section */}
                  <MessageInput 
                    canEdit={canEdit}
                    onSubmit={handleSubmitMessage}
                    isLoading={addCommentMutation.isLoading}
                  />
                  
                  
                  {/* Comments List */}
                  {commentsLoading ? (
                    <Box display="flex" justifyContent="center" py={3}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box>
                      {commentsData?.comments?.length > 0 ? (
                        <>
                          {/* Latest Messages Section */}
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              color: 'primary.main',
                              fontWeight: 600
                            }}>
                              <Comment fontSize="small" />
                              Latest Messages
                            </Typography>
                            <Box sx={{ 
                              maxHeight: '400px', 
                              overflowY: 'auto',
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 2,
                              p: 1
                            }}>
                              {commentsData.comments.slice(-3).reverse().map((comment, index) => {
                                const isRead = readMessages.has(comment.id);
                                const isRecentMessage = formatTimestampWithNewIndicator(comment.createdAt).isRecent;
                                // Only show as new if it's recent AND not read
                                const shouldHighlight = isRecentMessage && !isRead;
                                
                                return (
                                  <Box
                                    key={comment.id || index}
                                    sx={{
                                      p: 2,
                                      mb: 1,
                                      borderRadius: 1,
                                      border: shouldHighlight ? '2px solid' : '1px solid',
                                      borderColor: shouldHighlight ? 'warning.main' : 'divider',
                                      backgroundColor: shouldHighlight ? 'warning.light' : 'grey.50',
                                      cursor: 'pointer',
                                      '&:hover': {
                                        backgroundColor: shouldHighlight ? 'warning.light' : 'grey.100'
                                      },
                                      transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => handleMarkMessageAsRead(comment.id)}
                                  >
                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                      <Avatar sx={{ 
                                        width: 32, 
                                        height: 32,
                                        bgcolor: comment.isInternal ? 'secondary.main' : 'primary.main' 
                                      }}>
                                        {comment.tech?.name?.charAt(0) || 'T'}
                                      </Avatar>
                                      <Box>
                                        <Typography variant="body2" fontWeight={600}>
                                          {comment.tech?.name || 'Tech User'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {comment.createdAt ? formatTimestampWithNewIndicator(comment.createdAt).relative : ''}
                                        </Typography>
                                      </Box>
                                      {shouldHighlight && (
                                        <Chip 
                                          label="NEW" 
                                          size="small" 
                                          color="warning" 
                                          variant="filled"
                                          sx={{ fontSize: '0.65rem', height: '18px', ml: 'auto' }}
                                        />
                                      )}
                                      {comment.isInternal && canEdit && (
                                        <Chip 
                                          label="Internal" 
                                          size="small" 
                                          color="secondary" 
                                          variant="outlined"
                                        />
                                      )}
                                    </Box>
                                    <Typography variant="body2" color="text.primary">
                                      {comment.notes}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>

                          {/* All Messages Section */}
                          {commentsData.comments.length > 3 && (
                            <Box>
                              <Typography variant="h6" gutterBottom sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                color: 'text.secondary',
                                fontWeight: 600
                              }}>
                                <Timeline fontSize="small" />
                                All Messages ({commentsData.comments.length})
                              </Typography>
                              <Box sx={{ 
                                maxHeight: '300px', 
                                overflowY: 'auto',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                p: 1
                              }}>
                                {commentsData.comments.map((comment, index) => {
                                  const isRead = readMessages.has(comment.id);
                                  const isRecentMessage = formatTimestampWithNewIndicator(comment.createdAt).isRecent;
                                  // Only show as new if it's recent AND not read
                                  const shouldHighlight = isRecentMessage && !isRead;
                                  
                                  return (
                                    <Box
                                      key={comment.id || index}
                                      sx={{
                                        p: 1.5,
                                        mb: 0.5,
                                        borderRadius: 1,
                                        border: shouldHighlight ? '1px solid' : 'none',
                                        borderColor: shouldHighlight ? 'warning.main' : 'transparent',
                                        backgroundColor: shouldHighlight ? 'warning.light' : 'transparent',
                                        opacity: isRead ? 0.7 : 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                          backgroundColor: 'grey.50'
                                        },
                                        transition: 'all 0.2s ease'
                                      }}
                                      onClick={() => handleMarkMessageAsRead(comment.id)}
                                    >
                                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                        <Avatar sx={{ 
                                          width: 24, 
                                          height: 24,
                                          bgcolor: comment.isInternal ? 'secondary.main' : 'primary.main' 
                                        }}>
                                          {comment.tech?.name?.charAt(0) || 'T'}
                                        </Avatar>
                                        <Typography variant="body2" fontWeight={500}>
                                          {comment.tech?.name || 'Tech User'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {comment.createdAt ? format(new Date(comment.createdAt), 'MMM dd, HH:mm') : ''}
                                        </Typography>
                                        {shouldHighlight && (
                                          <Chip 
                                            label="NEW" 
                                            size="small" 
                                            color="warning" 
                                            variant="outlined"
                                            sx={{ fontSize: '0.6rem', height: '14px', ml: 'auto' }}
                                          />
                                        )}
                                      </Box>
                                      <Typography variant="body2" color="text.primary" sx={{ pl: 4 }}>
                                        {comment.notes}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                              </Box>
                            </Box>
                          )}
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary" align="center" py={3}>
                          No messages yet. Start the conversation!
                        </Typography>
                      )}
                    </Box>
                  )}
                </TabPanel>
                
                <TabPanel value={activeTab} index={1}>
                  {/* Activity Timeline */}
                  <List>
                    {request.activities?.map((activity, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: activity.activityType === 'status_change' ? 'primary.main' : 'secondary.main' }}>
                            {activity.activityType === 'status_change' ? <Flag /> : <Timeline />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">
                                {activity.tech?.name || 'Tech User'}
                              </Typography>
                              {activity.activityType === 'status_change' && (
                                <>
                                  <Typography variant="body2" color="text.secondary">
                                    changed status from
                                  </Typography>
                                  <Chip label={activity.oldStatus} size="small" />
                                  <Typography variant="body2" color="text.secondary">to</Typography>
                                  <Chip label={activity.newStatus} size="small" />
                                </>
                              )}
                            </Box>
                          }
                          primaryTypographyProps={{ component: 'div' }}
                          secondary={
                            <>
                              {activity.notes && (
                                <Typography variant="body2" color="text.primary" component="div">
                                  {activity.notes}
                                </Typography>
                              )}
                              {activity.timeSpent && (
                                <Typography variant="body2" color="text.secondary" component="div">
                                  Time spent: {activity.timeSpent} minutes
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" component="div">
                                {activity.createdAt ? format(new Date(activity.createdAt), 'MMM dd, yyyy hh:mm a') : ''}
                              </Typography>
                            </>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </TabPanel>
                
                <TabPanel value={activeTab} index={2}>
                  {/* File Upload */}
                  <Box sx={{ mb: 3 }}>
                    <input
                      accept="*"
                      style={{ display: 'none' }}
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="file-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<AttachFile />}
                        sx={{ mb: 2 }}
                      >
                        Upload Files
                      </Button>
                    </label>
                    
                    {/* Show selected files */}
                    {attachments.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Selected Files:
                        </Typography>
                        {attachments.map((file, index) => (
                          <Chip
                            key={index}
                            label={file.name}
                            onDelete={() => setAttachments(attachments.filter((_, i) => i !== index))}
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                  
                  {/* Existing files would go here */}
                  <Typography variant="body2" color="text.secondary">
                    No files uploaded yet
                  </Typography>
                </TabPanel>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Tech Control Panel - Only for tech users */}
          {canEdit && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                
                {/* Current Status Display */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current Status
                  </Typography>
                  <Chip
                    label={request.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(request.status)}
                    size="medium"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>

                {/* Quick Action Buttons */}
                <Stack spacing={2}>
                  {request.status === 'pending' && (
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      size="large"
                      startIcon={<PlayArrow />}
                      onClick={() => handleQuickStatusUpdate('in_progress', 'Work started')}
                      disabled={updateStatusMutation.isLoading}
                    >
                      Start Work
                    </Button>
                  )}
                  
                  {request.status === 'in_progress' && (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        size="large"
                        startIcon={<CheckCircle />}
                        onClick={() => handleQuickStatusUpdate('completed', 'Work completed')}
                        disabled={updateStatusMutation.isLoading}
                      >
                        Mark Complete
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        fullWidth
                        startIcon={<Pause />}
                        onClick={() => handleQuickStatusUpdate('on_hold', 'Put on hold')}
                        disabled={updateStatusMutation.isLoading}
                      >
                        Put On Hold
                      </Button>
                    </>
                  )}
                  
                  {request.status === 'on_hold' && (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        startIcon={<PlayArrow />}
                        onClick={() => handleQuickStatusUpdate('in_progress', 'Work resumed')}
                        disabled={updateStatusMutation.isLoading}
                      >
                        Resume Work
                      </Button>
                      <Button
                        variant="outlined"
                        color="success"
                        fullWidth
                        startIcon={<CheckCircle />}
                        onClick={() => handleQuickStatusUpdate('completed', 'Work completed')}
                        disabled={updateStatusMutation.isLoading}
                      >
                        Mark Complete
                      </Button>
                    </>
                  )}
                  
                  {request.status === 'completed' && (
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      startIcon={<PlayArrow />}
                      onClick={() => handleQuickStatusUpdate('in_progress', 'Work reopened')}
                      disabled={updateStatusMutation.isLoading}
                    >
                      Reopen
                    </Button>
                  )}
                </Stack>

                
                {/* Assignment Info */}
                {request.assignedUser && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Assigned To</Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={1}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {request.assignedUser.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body1">{request.assignedUser.name}</Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Contact Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Person color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{request.name}</Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Email color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{request.email}</Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Phone color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{request.phone}</Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Request Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Request Information
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <CalendarToday color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Created</Typography>
                    <Typography variant="body1">
                      {format(new Date(request.created_at), 'MMM dd, yyyy hh:mm a')}
                    </Typography>
                  </Box>
                </Box>
                {request.dueDate && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <CalendarToday color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Due Date</Typography>
                      <Typography variant="body1">
                        {format(new Date(request.dueDate), 'MMM dd, yyyy hh:mm a')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RequestDetail;