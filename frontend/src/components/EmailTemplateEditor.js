import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  TextField,
  Typography,
  Box,
  Stack,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Chip,
  Divider,
  alpha,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Email,
  Preview,
  Send,
  Edit,
  Save,
  Close,
  Visibility,
  Code,
  Help
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const EmailTemplateEditor = () => {
  const theme = useTheme();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [testDialog, setTestDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewContent, setPreviewContent] = useState({ subject: '', html: '' });
  const [testEmail, setTestEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Load email templates on component mount
  useEffect(() => {
    loadEmailTemplates();
  }, []);

  const loadEmailTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/email-templates`);
      
      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Error loading email templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate({ ...template });
    setEditDialog(true);
  };

  const handleSaveTemplate = async () => {
    try {
      setSaving(true);
      
      const response = await axios.put(`${API_BASE_URL}/admin/email-templates/${selectedTemplate.id}`, {
        templateName: selectedTemplate.templateName,
        subjectTemplate: selectedTemplate.subjectTemplate,
        htmlTemplate: selectedTemplate.htmlTemplate,
        description: selectedTemplate.description,
        isActive: selectedTemplate.isActive
      });

      if (response.data.success) {
        toast.success('Email template updated successfully!');
        setEditDialog(false);
        loadEmailTemplates();
      } else {
        toast.error(response.data.message || 'Failed to update template');
      }
    } catch (error) {
      console.error('Save template error:', error);
      toast.error(error.response?.data?.message || 'Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewTemplate = async (template) => {
    try {
      setPreviewing(true);
      
      const response = await axios.post(`${API_BASE_URL}/admin/email-templates/${template.id}/preview`);
      
      if (response.data.success) {
        setPreviewContent(response.data.preview);
        setPreviewDialog(true);
      } else {
        toast.error(response.data.message || 'Failed to preview template');
      }
    } catch (error) {
      console.error('Preview template error:', error);
      toast.error(error.response?.data?.message || 'Failed to preview template');
    } finally {
      setPreviewing(false);
    }
  };

  const handleTestTemplate = (template) => {
    setSelectedTemplate(template);
    setTestDialog(true);
  };

  const handleSendTestEmail = async () => {
    try {
      setSendingTest(true);
      
      const response = await axios.post(`${API_BASE_URL}/admin/email-templates/${selectedTemplate.id}/test`, {
        recipient: testEmail
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setTestDialog(false);
        setTestEmail('');
      } else {
        toast.error(response.data.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Test email error:', error);
      toast.error(error.response?.data?.message || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading email templates...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Email Templates
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Customize email templates sent to users for various system notifications.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card elevation={0} sx={{ 
              borderRadius: '16px', 
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              height: '100%'
            }}>
              <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                    <Email />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight={600}>
                      {template.templateName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                  </Box>
                  <Chip 
                    label={template.isActive ? 'Active' : 'Inactive'} 
                    color={template.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Stack>
              </Box>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Template Key:
                    </Typography>
                    <Chip label={template.templateKey} variant="outlined" size="small" />
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Subject Preview:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      bgcolor: alpha(theme.palette.grey[500], 0.1),
                      p: 1.5,
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}>
                      {template.subjectTemplate}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleEditTemplate(template)}
                      sx={{ borderRadius: '8px' }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Preview />}
                      onClick={() => handlePreviewTemplate(template)}
                      disabled={previewing}
                      sx={{ borderRadius: '8px' }}
                    >
                      Preview
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Send />}
                      onClick={() => handleTestTemplate(template)}
                      sx={{ borderRadius: '8px' }}
                    >
                      Test
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Template Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ backgroundColor: theme.palette.primary.main }}>
                <Edit />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Edit Email Template
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTemplate?.templateName}
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setEditDialog(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={selectedTemplate.templateName}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, templateName: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedTemplate.isActive}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, isActive: e.target.checked })}
                    />
                  }
                  label="Template Active"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={selectedTemplate.description || ''}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, description: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Subject Template
                  </Typography>
                  <Tooltip title="Use {{variableName}} for dynamic content">
                    <IconButton size="small">
                      <Help fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={selectedTemplate.subjectTemplate}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subjectTemplate: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  placeholder="Request Created: {{requestNumber}}"
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    HTML Template
                  </Typography>
                  <Tooltip title="Use {{variableName}} for dynamic content. HTML and inline CSS supported.">
                    <IconButton size="small">
                      <Help fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <TextField
                  fullWidth
                  multiline
                  rows={12}
                  value={selectedTemplate.htmlTemplate}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, htmlTemplate: e.target.value })}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                    '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.875rem' }
                  }}
                  placeholder="<div>Your HTML content with {{variables}} here</div>"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info" sx={{ borderRadius: '12px' }}>
                  <Typography variant="subtitle2" gutterBottom>Available Variables:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {['userName', 'requestNumber', 'requestType', 'status', 'urgency', 'department', 'assignedTo', 'commentBy'].map((variable) => (
                      <Chip key={variable} label={`{{${variable}}}`} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialog(false)} sx={{ borderRadius: '12px' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveTemplate} 
            variant="contained"
            disabled={saving}
            startIcon={<Save />}
            sx={{ borderRadius: '12px', fontWeight: 600 }}
          >
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ backgroundColor: theme.palette.info.main }}>
              <Visibility />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Email Preview
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Subject:
              </Typography>
              <Typography variant="body1" sx={{ 
                bgcolor: alpha(theme.palette.grey[500], 0.1),
                p: 2,
                borderRadius: '8px',
                fontWeight: 500
              }}>
                {previewContent.subject}
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Email Content:
              </Typography>
              <Box sx={{ 
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderRadius: '8px',
                p: 2,
                bgcolor: 'background.paper',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                <div dangerouslySetInnerHTML={{ __html: previewContent.html }} />
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPreviewDialog(false)} sx={{ borderRadius: '12px' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={testDialog} onClose={() => setTestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ backgroundColor: theme.palette.success.main }}>
              <Send />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Send Test Email
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedTemplate?.templateName}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Test Email Recipient"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            placeholder="user@example.com"
          />
          <Alert severity="info" sx={{ mt: 2, borderRadius: '12px' }}>
            This will send a test email using sample data to verify the template works correctly.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setTestDialog(false)} sx={{ borderRadius: '12px' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendTestEmail} 
            variant="contained"
            disabled={sendingTest || !testEmail}
            startIcon={<Send />}
            sx={{ borderRadius: '12px', fontWeight: 600 }}
          >
            {sendingTest ? 'Sending...' : 'Send Test Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailTemplateEditor;