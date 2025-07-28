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
  FormGroup,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  Stack
} from '@mui/material';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const EventRequestForm = ({ data, onChange }) => {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleFileChange = (field, file) => {
    onChange({ ...data, [field]: file });
  };

  const handleEquipmentChange = (equipment, checked) => {
    const currentEquipment = data.equipmentNeeded || [];
    if (checked) {
      handleChange('equipmentNeeded', [...currentEquipment, equipment]);
    } else {
      handleChange('equipmentNeeded', currentEquipment.filter(item => item !== equipment));
    }
  };

  const equipmentOptions = [
    { value: 'cameras', label: 'Cameras' },
    { value: 'director', label: 'Director' },
    { value: 'lyrics', label: 'Lyrics' },
    { value: 'sound', label: 'Sound' }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3}>
        {/* Basic Event Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Event Information</Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Event Name"
            value={data.eventName || ''}
            onChange={(e) => handleChange('eventName', e.target.value)}
            required
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Ministry in Charge"
            value={data.ministryInCharge || ''}
            onChange={(e) => handleChange('ministryInCharge', e.target.value)}
            required
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DateTimePicker
            label="Starting Date & Time"
            value={data.startingDate || null}
            onChange={(date) => handleChange('startingDate', date)}
            renderInput={(params) => <TextField {...params} fullWidth margin="normal" required />}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DateTimePicker
            label="Ending Date & Time"
            value={data.endingDate || null}
            onChange={(date) => handleChange('endingDate', date)}
            renderInput={(params) => <TextField {...params} fullWidth margin="normal" required />}
          />
        </Grid>

        {/* Graphics Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Graphics</Typography>
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={data.graphicRequired || false}
                onChange={(e) => handleChange('graphicRequired', e.target.checked)}
              />
            }
            label="Graphic required?"
          />
        </Grid>
        
        {data.graphicRequired && (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Graphic Concept Description"
                multiline
                rows={3}
                value={data.graphicConcept || ''}
                onChange={(e) => handleChange('graphicConcept', e.target.value)}
                margin="normal"
                helperText="Describe your graphic concept if not uploading a file"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                >
                  Upload Graphic Concept File
                  <input
                    type="file"
                    hidden
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => handleFileChange('graphicFile', e.target.files[0])}
                  />
                </Button>
                {data.graphicFile && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Selected: {data.graphicFile.name}
                  </Typography>
                )}
              </Box>
            </Grid>
          </>
        )}

        {/* Online Registration Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Online Registration</Typography>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Cost"
            type="number"
            value={data.cost || ''}
            onChange={(e) => handleChange('cost', e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: '$'
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={
              <Checkbox
                checked={data.ticketsOnline || false}
                onChange={(e) => handleChange('ticketsOnline', e.target.checked)}
              />
            }
            label="Tickets for online?"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={
              <Checkbox
                checked={data.ticketsInPerson || false}
                onChange={(e) => handleChange('ticketsInPerson', e.target.checked)}
              />
            }
            label="Tickets for in person?"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Links/Documents after Registration"
            multiline
            rows={3}
            value={data.registrationLinks || ''}
            onChange={(e) => handleChange('registrationLinks', e.target.value)}
            margin="normal"
            helperText="Enter any links or describe documents needed after registration"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
            >
              Upload Registration Documents
              <input
                type="file"
                hidden
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('registrationFiles', e.target.files[0])}
              />
            </Button>
            {data.registrationFiles && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {data.registrationFiles.name}
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Media Team / Equipment Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Media Team / Equipment Needed</Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {equipmentOptions.map((equipment) => {
              const isSelected = (data.equipmentNeeded || []).includes(equipment.value);
              return (
                <Chip
                  key={equipment.value}
                  label={equipment.label}
                  icon={isSelected ? <CheckCircle /> : <RadioButtonUnchecked />}
                  onClick={() => handleEquipmentChange(equipment.value, !isSelected)}
                  color={isSelected ? "primary" : "default"}
                  variant={isSelected ? "filled" : "outlined"}
                  sx={{
                    '& .MuiChip-icon': {
                      color: isSelected ? 'white' : 'inherit'
                    },
                    cursor: 'pointer',
                    marginBottom: 1
                  }}
                />
              );
            })}
          </Stack>
        </Grid>

        {/* Urgency */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
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
            label="Due Date (Optional)"
            value={data.dueDate || null}
            onChange={(date) => handleChange('dueDate', date)}
            renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
          />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default EventRequestForm;