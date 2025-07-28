import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation } from 'react-query';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Box,
  Alert,
  Card,
  CardContent,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  useTheme,
  alpha,
  Fade,
  Stack,
  LinearProgress,
  Skeleton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  CloudUpload,
  Event,
  Description,
  CalendarToday,
  LocationOn,
  People,
  Build,
  NoteAdd,
  AttachFile,
  ArrowBack,
  CheckCircle
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';

const TicketForm = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [file, setFile] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  
  const { control, register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      eventName: '',
      eventType: '',
      description: '',
      startDate: null,
      endDate: null,
      venue: '',
      attendeeCount: '',
      additionalRequirements: ''
    }
  });
  const eventType = watch('eventType');

  const { data: equipmentData } = useQuery('equipment', async () => {
    const response = await axios.get(`${API_BASE_URL}/equipment`);
    return response.data.equipment;
  });

  const createTicketMutation = useMutation(
    async (data) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'equipment') {
          data[key].forEach(id => formData.append('equipment[]', id));
        } else if (key === 'startDate' || key === 'endDate') {
          // Convert dates to ISO string format
          const dateValue = data[key];
          if (dateValue) {
            formData.append(key, new Date(dateValue).toISOString());
          }
        } else if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      
      if (file) {
        formData.append('presentationFile', file);
      }
      
      const response = await axios.post(`${API_BASE_URL}/tickets`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Ticket created successfully!');
        navigate(`/tickets/${data.ticket.id || data.ticket._id}`);
      },
      onError: (error) => {
        console.error('Ticket creation error:', error);
        if (error.response?.data?.errors) {
          // Show validation errors
          const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
          toast.error(`Validation errors: ${errorMessages}`);
        } else {
          toast.error(error.response?.data?.message || 'Failed to create ticket');
        }
      }
    }
  );

  const onSubmit = (data) => {
    createTicketMutation.mutate({
      ...data,
      equipment: selectedEquipment
    });
  };

  const handleEquipmentChange = (event) => {
    setSelectedEquipment(event.target.value);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
      } else {
        toast.error('Please upload a PDF or PowerPoint file');
        event.target.value = '';
      }
    }
  };

  const steps = [
    { 
      label: 'Event Details',
      icon: <Event />,
      description: 'Basic information about your event'
    },
    { 
      label: 'Schedule & Venue',
      icon: <CalendarToday />,
      description: 'When and where your event takes place'
    },
    { 
      label: 'Equipment & Files',
      icon: <Build />,
      description: 'Required equipment and presentation files'
    }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header Section */}
        <Box mb={4}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box>
                <Button
                  startIcon={<ArrowBack />}
                  onClick={() => navigate('/dashboard')}
                  sx={{ 
                    mb: 2, 
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  Back to Dashboard
                </Button>
                <Typography 
                  variant="h3" 
                  fontWeight="700" 
                  color="text.primary"
                  gutterBottom
                  sx={{ 
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Create New Ticket
                </Typography>
                <Typography 
                  variant="h6" 
                  color="text.secondary"
                  sx={{ fontWeight: 400 }}
                >
                  Fill out the form below to submit your event ticket request
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card 
                elevation={0}
                sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  borderRadius: '16px'
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: theme.palette.success.main,
                      width: 48,
                      height: 48,
                      mx: 'auto',
                      mb: 1
                    }}
                  >
                    <CheckCircle />
                  </Avatar>
                  <Typography variant="body2" fontWeight={600}>
                    Quick & Easy Process
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Usually processed within 24 hours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={4}>
          {/* Stepper Sidebar */}
          <Grid item xs={12} lg={3}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: '16px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                position: 'sticky',
                top: 24
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Progress
                </Typography>
                <Stepper orientation="vertical" activeStep={activeStep}>
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel
                        StepIconComponent={() => (
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              backgroundColor: index <= activeStep 
                                ? theme.palette.primary.main 
                                : alpha(theme.palette.primary.main, 0.1),
                              color: index <= activeStep 
                                ? 'white' 
                                : theme.palette.primary.main,
                              fontSize: '14px'
                            }}
                          >
                            {step.icon}
                          </Avatar>
                        )}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {step.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {step.description}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Form */}
          <Grid item xs={12} lg={9}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: '16px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              {createTicketMutation.isLoading && (
                <LinearProgress 
                  sx={{ 
                    borderTopLeftRadius: '16px', 
                    borderTopRightRadius: '16px' 
                  }} 
                />
              )}
              <CardContent sx={{ p: 4 }}>
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                  {/* Step 1: Event Details */}
                  <Fade in timeout={300}>
                    <Box>
                      <Box mb={4}>
                        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                          <Avatar
                            sx={{
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main
                            }}
                          >
                            <Event />
                          </Avatar>
                          <Box>
                            <Typography variant="h5" fontWeight={600}>
                              Event Information
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Tell us about your event
                            </Typography>
                          </Box>
                        </Stack>
                        <Divider />
                      </Box>

                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Event Name"
                            placeholder="Enter your event name"
                            {...register('eventName', { required: 'Event name is required' })}
                            error={!!errors.eventName}
                            helperText={errors.eventName?.message}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px'
                              }
                            }}
                            InputProps={{
                              startAdornment: (
                                <Event sx={{ color: 'text.secondary', mr: 1 }} />
                              )
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            select
                            label="Event Type"
                            {...register('eventType', { required: 'Event type is required' })}
                            error={!!errors.eventType}
                            helperText={errors.eventType?.message}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px'
                              }
                            }}
                          >
                            <MenuItem value="presentation">📊 Presentation</MenuItem>
                            <MenuItem value="conference">🎯 Conference</MenuItem>
                            <MenuItem value="workshop">🛠️ Workshop</MenuItem>
                            <MenuItem value="seminar">📚 Seminar</MenuItem>
                            <MenuItem value="other">➕ Other</MenuItem>
                          </TextField>
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Event Description"
                            placeholder="Describe your event in detail..."
                            {...register('description', { required: 'Description is required' })}
                            error={!!errors.description}
                            helperText={errors.description?.message}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px'
                              }
                            }}
                            InputProps={{
                              startAdornment: (
                                <Description sx={{ color: 'text.secondary', mr: 1, alignSelf: 'flex-start', mt: 1 }} />
                              )
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Fade>

                  {/* Step 2: Schedule & Venue */}
                  <Fade in timeout={500}>
                    <Box mt={5}>
                      <Box mb={4}>
                        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                          <Avatar
                            sx={{
                              backgroundColor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.main
                            }}
                          >
                            <CalendarToday />
                          </Avatar>
                          <Box>
                            <Typography variant="h5" fontWeight={600}>
                              Schedule & Venue
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              When and where will your event take place?
                            </Typography>
                          </Box>
                        </Stack>
                        <Divider />
                      </Box>

                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Controller
                            name="startDate"
                            control={control}
                            rules={{ required: 'Start date is required' }}
                            render={({ field }) => (
                              <DatePicker
                                label="Start Date"
                                value={field.value || null}
                                onChange={field.onChange}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    fullWidth
                                    error={!!errors.startDate}
                                    helperText={errors.startDate?.message}
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: '12px'
                                      }
                                    }}
                                  />
                                )}
                              />
                            )}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Controller
                            name="endDate"
                            control={control}
                            rules={{ required: 'End date is required' }}
                            render={({ field }) => (
                              <DatePicker
                                label="End Date"
                                value={field.value || null}
                                onChange={field.onChange}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    fullWidth
                                    error={!!errors.endDate}
                                    helperText={errors.endDate?.message}
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: '12px'
                                      }
                                    }}
                                  />
                                )}
                              />
                            )}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Venue"
                            placeholder="Enter venue location"
                            {...register('venue', { required: 'Venue is required' })}
                            error={!!errors.venue}
                            helperText={errors.venue?.message}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px'
                              }
                            }}
                            InputProps={{
                              startAdornment: (
                                <LocationOn sx={{ color: 'text.secondary', mr: 1 }} />
                              )
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Expected Attendees"
                            placeholder="Number of people"
                            {...register('attendeeCount', { 
                              required: 'Attendee count is required',
                              min: { value: 1, message: 'Must be at least 1' }
                            })}
                            error={!!errors.attendeeCount}
                            helperText={errors.attendeeCount?.message}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px'
                              }
                            }}
                            InputProps={{
                              startAdornment: (
                                <People sx={{ color: 'text.secondary', mr: 1 }} />
                              )
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Fade>

                  {/* Step 3: Equipment & Files */}
                  <Fade in timeout={700}>
                    <Box mt={5}>
                      <Box mb={4}>
                        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                          <Avatar
                            sx={{
                              backgroundColor: alpha(theme.palette.warning.main, 0.1),
                              color: theme.palette.warning.main
                            }}
                          >
                            <Build />
                          </Avatar>
                          <Box>
                            <Typography variant="h5" fontWeight={600}>
                              Equipment & Files
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Select required equipment and upload files
                            </Typography>
                          </Box>
                        </Stack>
                        <Divider />
                      </Box>

                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>Required Equipment</InputLabel>
                            <Select
                              multiple
                              value={selectedEquipment}
                              onChange={handleEquipmentChange}
                              sx={{
                                borderRadius: '12px'
                              }}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {(selected || []).map((value) => {
                                    const equipment = equipmentData?.find(eq => eq.id === value || eq._id === value);
                                    return (
                                      <Chip 
                                        key={value} 
                                        label={equipment?.name || 'Unknown'} 
                                        size="small"
                                        sx={{ borderRadius: '8px' }}
                                        color="primary"
                                        variant="outlined"
                                      />
                                    );
                                  })}
                                </Box>
                              )}
                            >
                              {equipmentData ? equipmentData.map((equipment) => (
                                <MenuItem key={equipment.id || equipment._id} value={equipment.id || equipment._id}>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <Build fontSize="small" color="action" />
                                    <span>{equipment.name} ({equipment.category})</span>
                                  </Stack>
                                </MenuItem>
                              )) : (
                                <MenuItem disabled>
                                  <Skeleton width={200} />
                                </MenuItem>
                              )}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Additional Requirements"
                            {...register('additionalRequirements')}
                            placeholder="Any special requirements, setup instructions, or notes..."
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px'
                              }
                            }}
                            InputProps={{
                              startAdornment: (
                                <NoteAdd sx={{ color: 'text.secondary', mr: 1, alignSelf: 'flex-start', mt: 1 }} />
                              )
                            }}
                          />
                        </Grid>

                        {eventType === 'presentation' && (
                          <Grid item xs={12}>
                            <Card 
                              elevation={0}
                              sx={{ 
                                border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                                borderRadius: '16px',
                                background: alpha(theme.palette.primary.main, 0.02),
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  borderColor: theme.palette.primary.main,
                                  background: alpha(theme.palette.primary.main, 0.05)
                                }
                              }}
                            >
                              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                <Avatar
                                  sx={{
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    width: 64,
                                    height: 64,
                                    mx: 'auto',
                                    mb: 2
                                  }}
                                >
                                  <CloudUpload sx={{ fontSize: 32 }} />
                                </Avatar>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                  Upload Presentation
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                  PDF or PowerPoint files only (max 50MB)
                                </Typography>
                                <input
                                  type="file"
                                  accept=".pdf,.ppt,.pptx"
                                  onChange={handleFileChange}
                                  style={{ display: 'none' }}
                                  id="file-upload"
                                />
                                <label htmlFor="file-upload">
                                  <Button 
                                    variant="contained" 
                                    component="span"
                                    startIcon={<AttachFile />}
                                    sx={{
                                      borderRadius: '12px',
                                      textTransform: 'none',
                                      fontWeight: 600
                                    }}
                                  >
                                    Choose File
                                  </Button>
                                </label>
                                {file && (
                                  <Alert 
                                    severity="success" 
                                    sx={{ 
                                      mt: 3,
                                      borderRadius: '12px',
                                      '& .MuiAlert-message': {
                                        fontWeight: 500
                                      }
                                    }}
                                    icon={<CheckCircle />}
                                  >
                                    File selected: {file.name}
                                  </Alert>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Fade>

                  {/* Action Buttons */}
                  <Box mt={6}>
                    <Divider sx={{ mb: 4 }} />
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/dashboard')}
                        disabled={createTicketMutation.isLoading}
                        sx={{
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 4
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={createTicketMutation.isLoading}
                        sx={{
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 4,
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`
                          },
                          '&:disabled': {
                            transform: 'none',
                            boxShadow: 'none'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {createTicketMutation.isLoading ? (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <LinearProgress 
                              size={20} 
                              sx={{ 
                                width: 20,
                                height: 20,
                                borderRadius: '50%'
                              }} 
                            />
                            <span>Creating...</span>
                          </Stack>
                        ) : (
                          'Create Ticket'
                        )}
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
};

export default TicketForm;