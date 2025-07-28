import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Button,
  Divider
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const GraphicRequestForm = ({ data, onChange }) => {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleFileChange = (field, files) => {
    onChange({ ...data, [field]: files });
  };

  const designTypes = [
    'Event Flyer/Poster',
    'Social Media Graphics',
    'Web Banner',
    'Business Card',
    'Brochure/Pamphlet',
    'Logo Design',
    'Presentation Design',
    'Certificate/Award',
    'T-shirt/Merchandise',
    'Video Thumbnail',
    'Other'
  ];

  const sizes = [
    { value: 'social_square', label: 'Social Media Square (1080x1080)' },
    { value: 'social_story', label: 'Instagram/FB Story (1080x1920)' },
    { value: 'social_post', label: 'Facebook Post (1200x630)' },
    { value: 'flyer_letter', label: 'Flyer - Letter Size (8.5x11)' },
    { value: 'flyer_half', label: 'Half Sheet Flyer (5.5x8.5)' },
    { value: 'banner_web', label: 'Web Banner (728x90 or custom)' },
    { value: 'poster_small', label: 'Small Poster (11x17)' },
    { value: 'poster_large', label: 'Large Poster (18x24)' },
    { value: 'business_card', label: 'Business Card (3.5x2)' },
    { value: 'custom', label: 'Custom Size' }
  ];

  const colorSchemes = [
    'Brand Colors (Houses of Light)',
    'Black and White',
    'Colorful/Vibrant',
    'Minimal/Clean',
    'Elegant/Formal',
    'Fun/Playful',
    'Custom (specify in description)'
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Graphic Design Request</Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Event/Project Name"
            value={data.eventName || ''}
            onChange={(e) => handleChange('eventName', e.target.value)}
            required
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DateTimePicker
            label="Event Date"
            value={data.eventDate || null}
            onChange={(date) => handleChange('eventDate', date)}
            renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Specific Font"
            value={data.specificFont || ''}
            onChange={(e) => handleChange('specificFont', e.target.value)}
            margin="normal"
            helperText="Preferred font or leave blank for designer's choice"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Color Preference"
            value={data.colorPreference || ''}
            onChange={(e) => handleChange('colorPreference', e.target.value)}
            margin="normal"
            helperText="Preferred colors or color scheme"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={data.isPreviousEvent || false}
                onChange={(e) => handleChange('isPreviousEvent', e.target.checked)}
              />
            }
            label="Is this a previous event?"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Reusable Items"
            multiline
            rows={4}
            value={data.reusableItems || ''}
            onChange={(e) => handleChange('reusableItems', e.target.value)}
            margin="normal"
            helperText="Any existing logos, banners, or graphics that can be reused"
          />
        </Grid>

        {/* Timeline */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Timeline</Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Urgency</InputLabel>
            <Select
              value={data.urgency || 'normal'}
              label="Urgency"
              onChange={(e) => handleChange('urgency', e.target.value)}
            >
              <MenuItem value="normal">Normal (3-5 business days)</MenuItem>
              <MenuItem value="urgent">Urgent (1-2 business days)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DateTimePicker
            label="Needed By"
            value={data.dueDate || null}
            onChange={(date) => handleChange('dueDate', date)}
            renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
          />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default GraphicRequestForm;