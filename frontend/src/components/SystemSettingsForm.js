import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  TextField,
  Typography,
  Box,
  Stack,
  Avatar,
  FormControlLabel,
  Switch,
  MenuItem,
  Button,
  Divider,
  alpha
} from '@mui/material';
import {
  Business,
  Email,
  Computer,
  Notifications,
  Security,
  Build,
  Send
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const SystemSettingsForm = () => {
  const theme = useTheme();
  const [systemSettings, setSystemSettings] = useState({
    emailSettings: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromName: 'Houses of Light',
      fromEmail: '',
      notificationsEnabled: true,
      testEmailRecipient: ''
    },
    systemDefaults: {
      defaultUrgency: 'normal',
      autoAssignEnabled: false,
      requestNumberPrefix: 'REQ',
      maxFileSize: 50,
      sessionTimeout: 24,
      passwordMinLength: 8,
      enableFileUploads: true
    },
    organizationSettings: {
      organizationName: 'Houses of Light',
      supportEmail: '',
      websiteUrl: '',
      address: '',
      phone: '',
      timeZone: 'America/New_York'
    },
    notificationSettings: {
      emailNotifications: true,
      pushNotifications: true,
      notifyOnAssignment: true,
      notifyOnStatusChange: true,
      notifyOnComment: true,
      dailyDigest: false,
      weeklyReport: false
    },
    securitySettings: {
      enableTwoFactor: false,
      loginAttemptLimit: 5,
      sessionTimeout: 24,
      requirePasswordChange: false,
      passwordExpirationDays: 90,
      enableAuditLog: true,
      allowMultipleSessions: true
    },
    maintenanceSettings: {
      maintenanceMode: false,
      backupEnabled: true,
      backupFrequency: 'daily',
      autoCleanupDays: 30,
      enableSystemAlerts: true,
      debugMode: false
    }
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Load system settings on component mount
  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        setSettingsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/admin/settings`);
        
        if (response.data.success) {
          console.log('Loaded settings from backend:', response.data.settings);
          setSystemSettings(response.data.settings);
        }
      } catch (error) {
        console.error('Error loading system settings:', error);
        toast.error('Failed to load system settings');
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSystemSettings();
  }, []);

  // System settings handlers
  const handleSettingsChange = useCallback((category, field, value) => {
    console.log(`🔧 ISOLATED handleSettingsChange: ${field} = ${value}`);
    setSystemSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [field]: value
      }
    }));
  }, []);

  const handleSaveSettings = useCallback(async () => {
    try {
      setSettingsSaving(true);
      
      const response = await axios.put(`${API_BASE_URL}/admin/settings`, systemSettings);

      if (response.data.success) {
        toast.success('System settings updated successfully!');
      } else {
        toast.error(response.data.message || 'Failed to update system settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error(error.response?.data?.message || 'Failed to update system settings');
    } finally {
      setSettingsSaving(false);
    }
  }, [systemSettings]);

  const handleTestEmail = useCallback(async () => {
    try {
      const recipient = systemSettings.emailSettings.testEmailRecipient;
      
      if (!recipient) {
        toast.error('Please enter a test email recipient first');
        return;
      }

      toast.info('Sending test email...');
      
      const response = await axios.post(`${API_BASE_URL}/admin/settings/test-email`, {
        recipient: recipient
      });

      if (response.data.success) {
        toast.success(`Test email sent successfully to ${recipient}`);
      } else {
        toast.error(response.data.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Test email error:', error);
      let errorMessage = 'Failed to send test email. Please check your SMTP configuration.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'SMTP configuration is incomplete. Please fill in all required fields and save settings first.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred while sending test email. Please check server logs for details.';
      }
      
      toast.error(errorMessage);
    }
  }, [systemSettings.emailSettings.testEmailRecipient]);

  console.log('🏠 SystemSettingsForm render');

  if (settingsLoading) {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent>
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography>Loading...</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Email Settings */}
      <Grid item xs={12} md={6}>
        <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, height: 'fit-content' }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ backgroundColor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
                <Email />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Email Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure SMTP settings for outgoing emails
                </Typography>
              </Box>
            </Stack>
          </Box>
          <CardContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="SMTP Host"
                value={systemSettings.emailSettings?.smtpHost || ''}
                onChange={(e) => {
                  console.log('⌨️ SMTP Host typing:', e.target.value);
                  handleSettingsChange('emailSettings', 'smtpHost', e.target.value);
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                label="SMTP Port"
                type="number"
                value={systemSettings.emailSettings?.smtpPort || 587}
                onChange={(e) => handleSettingsChange('emailSettings', 'smtpPort', parseInt(e.target.value))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                label="SMTP Username"
                value={systemSettings.emailSettings?.smtpUser || ''}
                onChange={(e) => handleSettingsChange('emailSettings', 'smtpUser', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                label="SMTP Password"
                type="password"
                value={systemSettings.emailSettings?.smtpPassword || ''}
                onChange={(e) => handleSettingsChange('emailSettings', 'smtpPassword', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                label="Test Email Recipient"
                type="email"
                value={systemSettings.emailSettings?.testEmailRecipient || ''}
                onChange={(e) => handleSettingsChange('emailSettings', 'testEmailRecipient', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <Button
                variant="outlined"
                startIcon={<Send />}
                onClick={handleTestEmail}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
              >
                Send Test Email
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Organization Settings */}
      <Grid item xs={12} md={6}>
        <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, height: 'fit-content' }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Organization Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure organization information and contact details
                </Typography>
              </Box>
            </Stack>
          </Box>
          <CardContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Organization Name"
                value={systemSettings.organizationSettings?.organizationName || ''}
                onChange={(e) => handleSettingsChange('organizationSettings', 'organizationName', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                label="Support Email"
                type="email"
                value={systemSettings.organizationSettings?.supportEmail || ''}
                onChange={(e) => handleSettingsChange('organizationSettings', 'supportEmail', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                label="Website URL"
                value={systemSettings.organizationSettings?.websiteUrl || ''}
                onChange={(e) => handleSettingsChange('organizationSettings', 'websiteUrl', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Address"
                value={systemSettings.organizationSettings?.address || ''}
                onChange={(e) => handleSettingsChange('organizationSettings', 'address', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                label="Phone Number"
                value={systemSettings.organizationSettings?.phone || ''}
                onChange={(e) => handleSettingsChange('organizationSettings', 'phone', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                select
                fullWidth
                label="Time Zone"
                value={systemSettings.organizationSettings?.timeZone || 'America/New_York'}
                onChange={(e) => handleSettingsChange('organizationSettings', 'timeZone', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              >
                <MenuItem value="America/New_York">Eastern Time</MenuItem>
                <MenuItem value="America/Chicago">Central Time</MenuItem>
                <MenuItem value="America/Denver">Mountain Time</MenuItem>
                <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                <MenuItem value="UTC">UTC</MenuItem>
              </TextField>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* System Defaults */}
      <Grid item xs={12} md={6}>
        <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, height: 'fit-content' }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ backgroundColor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main }}>
                <Computer />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  System Defaults
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure default values and system behavior
                </Typography>
              </Box>
            </Stack>
          </Box>
          <CardContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <TextField
                select
                fullWidth
                label="Default Request Urgency"
                value={systemSettings.systemDefaults?.defaultUrgency || 'normal'}
                onChange={(e) => handleSettingsChange('systemDefaults', 'defaultUrgency', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Request Number Prefix"
                value={systemSettings.systemDefaults?.requestNumberPrefix || 'REQ'}
                onChange={(e) => handleSettingsChange('systemDefaults', 'requestNumberPrefix', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                label="Maximum File Size (MB)"
                type="number"
                value={systemSettings.systemDefaults?.maxFileSize || 50}
                onChange={(e) => handleSettingsChange('systemDefaults', 'maxFileSize', parseInt(e.target.value))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                label="Session Timeout (Hours)"
                type="number"
                value={systemSettings.systemDefaults?.sessionTimeout || 24}
                onChange={(e) => handleSettingsChange('systemDefaults', 'sessionTimeout', parseInt(e.target.value))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                label="Minimum Password Length"
                type="number"
                value={systemSettings.systemDefaults?.passwordMinLength || 8}
                onChange={(e) => handleSettingsChange('systemDefaults', 'passwordMinLength', parseInt(e.target.value))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.systemDefaults?.autoAssignEnabled || false}
                    onChange={(e) => handleSettingsChange('systemDefaults', 'autoAssignEnabled', e.target.checked)}
                  />
                }
                label="Enable Auto-Assignment"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.systemDefaults?.enableFileUploads || true}
                    onChange={(e) => handleSettingsChange('systemDefaults', 'enableFileUploads', e.target.checked)}
                  />
                }
                label="Enable File Uploads"
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Notification Settings */}
      <Grid item xs={12} md={6}>
        <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, height: 'fit-content' }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ backgroundColor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main }}>
                <Notifications />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Notification Preferences
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure when and how users receive notifications
                </Typography>
              </Box>
            </Stack>
          </Box>
          <CardContent sx={{ pt: 3 }}>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.notificationSettings?.emailNotifications || true}
                    onChange={(e) => handleSettingsChange('notificationSettings', 'emailNotifications', e.target.checked)}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.notificationSettings?.pushNotifications || true}
                    onChange={(e) => handleSettingsChange('notificationSettings', 'pushNotifications', e.target.checked)}
                  />
                }
                label="Push Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.notificationSettings?.notifyOnAssignment || true}
                    onChange={(e) => handleSettingsChange('notificationSettings', 'notifyOnAssignment', e.target.checked)}
                  />
                }
                label="Notify on Assignment"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.notificationSettings?.notifyOnStatusChange || true}
                    onChange={(e) => handleSettingsChange('notificationSettings', 'notifyOnStatusChange', e.target.checked)}
                  />
                }
                label="Notify on Status Change"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.notificationSettings?.notifyOnComment || true}
                    onChange={(e) => handleSettingsChange('notificationSettings', 'notifyOnComment', e.target.checked)}
                  />
                }
                label="Notify on Comments"
              />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Digest Options
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.notificationSettings?.dailyDigest || false}
                    onChange={(e) => handleSettingsChange('notificationSettings', 'dailyDigest', e.target.checked)}
                  />
                }
                label="Daily Digest Email"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.notificationSettings?.weeklyReport || false}
                    onChange={(e) => handleSettingsChange('notificationSettings', 'weeklyReport', e.target.checked)}
                  />
                }
                label="Weekly Report Email"
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Security Settings */}
      <Grid item xs={12} md={6}>
        <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, height: 'fit-content' }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ backgroundColor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main }}>
                <Security />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Security Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure security and authentication options
                </Typography>
              </Box>
            </Stack>
          </Box>
          <CardContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.securitySettings?.enableTwoFactor || false}
                    onChange={(e) => handleSettingsChange('securitySettings', 'enableTwoFactor', e.target.checked)}
                  />
                }
                label="Enable Two-Factor Authentication"
              />
              <TextField
                fullWidth
                label="Login Attempt Limit"
                type="number"
                value={systemSettings.securitySettings?.loginAttemptLimit || 5}
                onChange={(e) => handleSettingsChange('securitySettings', 'loginAttemptLimit', parseInt(e.target.value))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                label="Password Expiration (Days)"
                type="number"
                value={systemSettings.securitySettings?.passwordExpirationDays || 90}
                onChange={(e) => handleSettingsChange('securitySettings', 'passwordExpirationDays', parseInt(e.target.value))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.securitySettings?.requirePasswordChange || false}
                    onChange={(e) => handleSettingsChange('securitySettings', 'requirePasswordChange', e.target.checked)}
                  />
                }
                label="Require Password Change on First Login"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.securitySettings?.enableAuditLog || true}
                    onChange={(e) => handleSettingsChange('securitySettings', 'enableAuditLog', e.target.checked)}
                  />
                }
                label="Enable Audit Logging"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.securitySettings?.allowMultipleSessions || true}
                    onChange={(e) => handleSettingsChange('securitySettings', 'allowMultipleSessions', e.target.checked)}
                  />
                }
                label="Allow Multiple Sessions"
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Maintenance Settings */}
      <Grid item xs={12} md={6}>
        <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, height: 'fit-content' }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ backgroundColor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main }}>
                <Build />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Maintenance & Backup
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  System maintenance and backup configuration
                </Typography>
              </Box>
            </Stack>
          </Box>
          <CardContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.maintenanceSettings?.maintenanceMode || false}
                    onChange={(e) => handleSettingsChange('maintenanceSettings', 'maintenanceMode', e.target.checked)}
                  />
                }
                label="Maintenance Mode"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.maintenanceSettings?.backupEnabled || true}
                    onChange={(e) => handleSettingsChange('maintenanceSettings', 'backupEnabled', e.target.checked)}
                  />
                }
                label="Enable Automatic Backups"
              />
              <TextField
                fullWidth
                select
                label="Backup Frequency"
                value={systemSettings.maintenanceSettings?.backupFrequency || 'daily'}
                onChange={(e) => handleSettingsChange('maintenanceSettings', 'backupFrequency', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              >
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Auto Cleanup (Days)"
                type="number"
                value={systemSettings.maintenanceSettings?.autoCleanupDays || 30}
                onChange={(e) => handleSettingsChange('maintenanceSettings', 'autoCleanupDays', parseInt(e.target.value))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.maintenanceSettings?.enableSystemAlerts || true}
                    onChange={(e) => handleSettingsChange('maintenanceSettings', 'enableSystemAlerts', e.target.checked)}
                  />
                }
                label="Enable System Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.maintenanceSettings?.debugMode || false}
                    onChange={(e) => handleSettingsChange('maintenanceSettings', 'debugMode', e.target.checked)}
                  />
                }
                label="Debug Mode"
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Save Button */}
      <Grid item xs={12}>
        <Box display="flex" justifyContent="center">
          <Button
            variant="contained"
            onClick={handleSaveSettings}
            disabled={settingsSaving}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 4 }}
          >
            {settingsSaving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

export default SystemSettingsForm;