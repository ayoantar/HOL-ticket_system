import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useMutation } from 'react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import EventRequestForm from '../components/forms/EventRequestForm';
import WebRequestForm from '../components/forms/WebRequestForm';
import TechnicalRequestForm from '../components/forms/TechnicalRequestForm';
import GraphicRequestForm from '../components/forms/GraphicRequestForm';

const NewRequestForm = () => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [requestType, setRequestType] = useState('');
  const [userInfo, setUserInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState(null);

  const steps = ['Select Request Type', 'User Information', 'Request Details', 'Review & Submit'];

  const requestTypes = [
    { value: 'event', label: 'New Event', description: 'Request for a new event setup' },
    { value: 'web', label: 'Web Request', description: 'Website updates or modifications' },
    { value: 'technical', label: 'Technical Issue', description: 'Report technical problems' },
    { value: 'graphic', label: 'Graphic Designs', description: 'Request graphic design work' }
  ];

  const createRequestMutation = useMutation(
    (data) => {
      const formDataToSend = new FormData();
      
      // Add basic fields
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          if (key === 'equipmentNeeded' && Array.isArray(data[key])) {
            formDataToSend.append(key, JSON.stringify(data[key]));
          } else if (key.includes('File') && data[key] instanceof File) {
            formDataToSend.append(key, data[key]);
          } else if (data[key] instanceof Date) {
            // Check if date is valid before converting to ISO string
            if (isNaN(data[key].getTime())) {
              console.error(`Invalid date for field ${key}:`, data[key]);
              // Skip invalid dates - don't send them to backend
              return;
            }
            formDataToSend.append(key, data[key].toISOString());
          } else {
            formDataToSend.append(key, data[key]);
          }
        }
      });
      
      return axios.post(`${API_BASE_URL}/requests`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    {
      onSuccess: (response) => {
        setAlert({ 
          type: 'success', 
          message: `Request ${response.data.request.requestNumber} submitted successfully!` 
        });
        // Reset form
        setActiveStep(0);
        setRequestType('');
        setFormData({});
        setUserInfo({
          name: user?.name || '',
          email: user?.email || '',
          phone: ''
        });
      },
      onError: (error) => {
        console.error('Request submission error:', error);
        console.error('Error response:', error.response?.data);
        
        let errorMessage = 'Failed to submit request';
        let errorId = null;
        let showErrorId = true;
        
        if (error.response?.data?.errorId) {
          errorId = error.response.data.errorId;
        }
        
        if (error.response?.data?.validationErrors) {
          // Validation errors - show user-friendly messages without error ID
          console.log('Validation errors:', error.response.data.validationErrors);
          const validationErrors = error.response.data.validationErrors;
          
          // Use the user-friendly message from backend if available
          if (error.response.data.message && error.response.data.message.startsWith('Please fix the following errors:')) {
            errorMessage = error.response.data.message;
            showErrorId = false; // Don't show error ID for validation errors
          } else {
            // Fallback to constructing error message from validation errors
            errorMessage = 'Please fix the following errors:\n' + 
              validationErrors.map(err => {
                const fieldName = err.path || err.param || 'field';
                return `• ${fieldName}: ${err.msg}`;
              }).join('\n');
            showErrorId = false;
          }
        } else if (error.response?.data?.errors) {
          // Legacy validation errors format
          console.log('Legacy validation errors:', error.response.data.errors);
          errorMessage = 'Please fix the following errors:\n' + 
            error.response.data.errors.map(err => `• ${err.param}: ${err.msg}`).join('\n');
          showErrorId = false;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        // Only include error ID for non-validation errors
        const fullErrorMessage = (errorId && showErrorId) 
          ? `${errorMessage}\n\nError ID: ${errorId} (Please provide this ID when contacting support)`
          : errorMessage;
        
        setAlert({ 
          type: 'error', 
          message: fullErrorMessage
        });
      }
    }
  );

  const handleNext = () => {
    if (activeStep === 0 && !requestType) {
      setAlert({ type: 'error', message: 'Please select a request type' });
      return;
    }
    if (activeStep === 1) {
      if (!userInfo.name || !userInfo.email || !userInfo.phone) {
        setAlert({ type: 'error', message: 'Please fill in all user information' });
        return;
      }
    }
    setAlert(null);
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    // Validate dates for event requests
    if (requestType === 'event') {
      if (!formData.startingDate || !formData.endingDate) {
        setAlert({ type: 'error', message: 'Please select both starting and ending dates for the event' });
        return;
      }
      
      if (formData.startingDate instanceof Date && isNaN(formData.startingDate.getTime())) {
        setAlert({ type: 'error', message: 'Please select a valid starting date' });
        return;
      }
      
      if (formData.endingDate instanceof Date && isNaN(formData.endingDate.getTime())) {
        setAlert({ type: 'error', message: 'Please select a valid ending date' });
        return;
      }
    }
    
    const requestData = {
      requestType,
      ...userInfo,
      ...formData
    };
    console.log('Submitting request data:', requestData);
    createRequestMutation.mutate(requestData);
  };

  const renderReviewContent = () => {
    if (!formData || Object.keys(formData).length === 0) {
      return <Typography color="text.secondary">No details provided</Typography>;
    }

    switch (requestType) {
      case 'event':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Event Name</Typography>
              <Typography variant="body1">{formData.eventName || 'Not specified'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Ministry in Charge</Typography>
              <Typography variant="body1">{formData.ministryInCharge || 'Not specified'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Starting Date</Typography>
              <Typography variant="body1">
                {formData.startingDate ? new Date(formData.startingDate).toLocaleDateString() : 'Not specified'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Ending Date</Typography>
              <Typography variant="body1">
                {formData.endingDate ? new Date(formData.endingDate).toLocaleDateString() : 'Not specified'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Graphics Required</Typography>
              <Typography variant="body1">{formData.graphicRequired ? 'Yes' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Cost</Typography>
              <Typography variant="body1">{formData.cost ? `$${formData.cost}` : 'Not specified'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Online Tickets</Typography>
              <Typography variant="body1">{formData.ticketsOnline ? 'Yes' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">In-Person Tickets</Typography>
              <Typography variant="body1">{formData.ticketsInPerson ? 'Yes' : 'No'}</Typography>
            </Grid>
            {formData.equipmentNeeded && formData.equipmentNeeded.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Equipment Needed</Typography>
                <Typography variant="body1">{formData.equipmentNeeded.join(', ')}</Typography>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Urgency</Typography>
              <Typography variant="body1">{formData.urgency || 'Normal'}</Typography>
            </Grid>
            {formData.dueDate && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Due Date</Typography>
                <Typography variant="body1">
                  {new Date(formData.dueDate).toLocaleDateString()}
                </Typography>
              </Grid>
            )}
          </Grid>
        );

      case 'web':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Domain</Typography>
              <Typography variant="body1">{formData.domain || 'Not specified'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Urgency</Typography>
              <Typography variant="body1">{formData.urgency || 'Normal'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Description</Typography>
              <Typography variant="body1">{formData.description || 'Not specified'}</Typography>
            </Grid>
            {formData.dueDate && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Due Date</Typography>
                <Typography variant="body1">
                  {new Date(formData.dueDate).toLocaleDateString()}
                </Typography>
              </Grid>
            )}
          </Grid>
        );

      case 'technical':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Issue Type</Typography>
              <Typography variant="body1">{formData.issueType || 'Not specified'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Severity</Typography>
              <Typography variant="body1">{formData.severity || 'Not specified'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Issue Description</Typography>
              <Typography variant="body1">{formData.issueDescription || 'Not specified'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Urgency</Typography>
              <Typography variant="body1">{formData.urgency || 'Normal'}</Typography>
            </Grid>
            {formData.dueDate && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Needed By</Typography>
                <Typography variant="body1">
                  {new Date(formData.dueDate).toLocaleDateString()}
                </Typography>
              </Grid>
            )}
          </Grid>
        );

      case 'graphic':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Event Name</Typography>
              <Typography variant="body1">{formData.eventName || 'Not specified'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Event Date</Typography>
              <Typography variant="body1">
                {formData.eventDate ? new Date(formData.eventDate).toLocaleDateString() : 'Not specified'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Specific Font</Typography>
              <Typography variant="body1">{formData.specificFont || 'Designer\'s choice'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Color Preference</Typography>
              <Typography variant="body1">{formData.colorPreference || 'Not specified'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Previous Event</Typography>
              <Typography variant="body1">{formData.isPreviousEvent ? 'Yes' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Urgency</Typography>
              <Typography variant="body1">{formData.urgency || 'Normal'}</Typography>
            </Grid>
            {formData.reusableItems && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Reusable Items</Typography>
                <Typography variant="body1">{formData.reusableItems}</Typography>
              </Grid>
            )}
            {formData.dueDate && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Due Date</Typography>
                <Typography variant="body1">
                  {new Date(formData.dueDate).toLocaleDateString()}
                </Typography>
              </Grid>
            )}
          </Grid>
        );

      default:
        return <Typography color="text.secondary">Unknown request type</Typography>;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Request Type
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Request Type</InputLabel>
              <Select
                value={requestType}
                label="Request Type"
                onChange={(e) => setRequestType(e.target.value)}
              >
                {requestTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box>
                      <Typography variant="subtitle1">{type.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                  required
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Request Details
            </Typography>
            {requestType === 'event' && (
              <EventRequestForm data={formData} onChange={setFormData} />
            )}
            {requestType === 'web' && (
              <WebRequestForm data={formData} onChange={setFormData} />
            )}
            {requestType === 'technical' && (
              <TechnicalRequestForm data={formData} onChange={setFormData} />
            )}
            {requestType === 'graphic' && (
              <GraphicRequestForm data={formData} onChange={setFormData} />
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Submit
            </Typography>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Request Type</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {requestTypes.find(t => t.value === requestType)?.label}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>Contact Information</Typography>
              <Typography variant="body2" color="text.secondary">
                {userInfo.name} • {userInfo.email} • {userInfo.phone}
              </Typography>
            </Paper>
            
            {/* Render specific review content based on request type */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Request Details</Typography>
              {renderReviewContent()}
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Submit New Request
        </Typography>
        
        {alert && (
          <Alert severity={alert.type} sx={{ mb: 3, whiteSpace: 'pre-line' }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={createRequestMutation.isLoading}
            >
              {createRequestMutation.isLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default NewRequestForm;