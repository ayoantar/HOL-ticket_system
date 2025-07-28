import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const WebRequestForm = ({ data, onChange }) => {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const domainOptions = [
    'housesoflight.org',
    'housesoflight.church',
    'hbrp.la',
    'housesoflight.network',
    'netzgomez.com',
    'turningheartsacademy.com',
    'pasionporjesus.la',
    'blumacademy.com',
    'centrodeasesoriafamiliar.org',
    'casaderestauracion.la',
    'raicesprofundas.la'
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Web Request Details</Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Domain</InputLabel>
            <Select
              value={data.domain || ''}
              label="Domain"
              onChange={(e) => handleChange('domain', e.target.value)}
            >
              {domainOptions.map((domain) => (
                <MenuItem key={domain} value={domain}>
                  {domain}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Describe your request"
            multiline
            rows={6}
            value={data.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            required
            margin="normal"
            helperText="Please provide detailed information about what changes or updates you need"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DateTimePicker
            label="Due Date"
            value={data.dueDate || null}
            onChange={(date) => handleChange('dueDate', date)}
            renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
          />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default WebRequestForm;