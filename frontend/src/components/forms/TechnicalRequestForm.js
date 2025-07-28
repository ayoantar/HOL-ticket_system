import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Button
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const TechnicalRequestForm = ({ data, onChange }) => {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleFileChange = (field, file) => {
    onChange({ ...data, [field]: file });
  };

  const severityOptions = [
    { value: 'low', label: 'Low - Minor issue, can wait' },
    { value: 'medium', label: 'Medium - Affects workflow but not critical' },
    { value: 'high', label: 'High - Significantly impacts work' },
    { value: 'critical', label: 'Critical - System down or urgent fix needed' }
  ];

  const issueTypes = [
    'Hardware Problem',
    'Software Issue',
    'Network/Internet',
    'Email Problem',
    'Printing Issues',
    'Account/Login Issues',
    'Application Error',
    'Performance Issues',
    'Security Concern',
    'Other'
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Technical Issue Details</Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Issue Type</InputLabel>
            <Select
              value={data.issueType || ''}
              label="Issue Type"
              onChange={(e) => handleChange('issueType', e.target.value)}
            >
              {issueTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Severity</InputLabel>
            <Select
              value={data.severity || 'medium'}
              label="Severity"
              onChange={(e) => handleChange('severity', e.target.value)}
            >
              {severityOptions.map((severity) => (
                <MenuItem key={severity.value} value={severity.value}>
                  {severity.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Issue Description"
            multiline
            rows={6}
            value={data.issueDescription || ''}
            onChange={(e) => handleChange('issueDescription', e.target.value)}
            required
            margin="normal"
            helperText="Please describe the problem in detail - include issue type, severity, steps to reproduce, device info, error messages, and attempted solutions"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Steps to Reproduce"
            multiline
            rows={4}
            value={data.stepsToReproduce || ''}
            onChange={(e) => handleChange('stepsToReproduce', e.target.value)}
            margin="normal"
            helperText="List the steps that lead to this problem (if applicable)"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Device/System Information"
            multiline
            rows={4}
            value={data.deviceInfo || ''}
            onChange={(e) => handleChange('deviceInfo', e.target.value)}
            margin="normal"
            helperText="Computer model, operating system, browser, etc."
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Error Messages"
            multiline
            rows={3}
            value={data.errorMessages || ''}
            onChange={(e) => handleChange('errorMessages', e.target.value)}
            margin="normal"
            helperText="Copy and paste any error messages you see"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Attempted Solutions"
            multiline
            rows={3}
            value={data.attemptedSolutions || ''}
            onChange={(e) => handleChange('attemptedSolutions', e.target.value)}
            margin="normal"
            helperText="What have you already tried to fix this?"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
            >
              Upload Screenshots/Documents
              <input
                type="file"
                hidden
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => handleFileChange('attachments', e.target.files[0])}
              />
            </Button>
            {data.attachments && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {data.attachments.name}
              </Typography>
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Urgency</InputLabel>
            <Select
              value={data.urgency || 'normal'}
              label="Urgency"
              onChange={(e) => handleChange('urgency', e.target.value)}
            >
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DateTimePicker
            label="When Did This Start?"
            value={data.issueStarted || null}
            onChange={(date) => handleChange('issueStarted', date)}
            renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DateTimePicker
            label="Needed By (Optional)"
            value={data.dueDate || null}
            onChange={(date) => handleChange('dueDate', date)}
            renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
          />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default TechnicalRequestForm;