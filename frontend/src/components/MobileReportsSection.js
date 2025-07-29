import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Avatar,
  Chip,
  Button,
  MenuItem,
  TextField,
  IconButton,
  Collapse,
  Skeleton,
  alpha,
  useTheme,
  Divider,
  Badge,
  Paper
} from '@mui/material';
import {
  Analytics,
  Add,
  People,
  Settings,
  GetApp,
  TableChart,
  PictureAsPdf,
  Refresh,
  FilterList,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp,
  Business,
  Assessment,
  Timeline
} from '@mui/icons-material';

const MobileReportsSection = ({
  analyticsData,
  systemMetrics,
  analyticsTimeframe,
  setAnalyticsTimeframe,
  analyticsLoading,
  metricsLoading,
  handleExportCSV,
  handleExportPDF,
  handleRefreshData
}) => {
  const theme = useTheme();
  const [expandedSection, setExpandedSection] = useState('overview');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isLoading = analyticsLoading || metricsLoading;

  // Mobile-optimized export buttons
  const MobileExportButtons = () => (
    <Grid container spacing={1} sx={{ mt: 1 }}>
      <Grid item xs={6}>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          startIcon={<TableChart />}
          onClick={() => handleExportCSV('analytics')}
          sx={{ 
            borderRadius: '8px', 
            textTransform: 'none', 
            fontSize: '0.75rem',
            py: 1
          }}
        >
          CSV
        </Button>
      </Grid>
      <Grid item xs={6}>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          startIcon={<PictureAsPdf />}
          onClick={handleExportPDF}
          sx={{ 
            borderRadius: '8px', 
            textTransform: 'none', 
            fontSize: '0.75rem',
            py: 1
          }}
        >
          PDF
        </Button>
      </Grid>
    </Grid>
  );

  // Mobile-optimized stat card
  const MobileStatCard = ({ icon, title, value, color = 'primary', subtitle }) => (
    <Card 
      elevation={0} 
      sx={{ 
        borderRadius: '12px', 
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        height: '100%'
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ 
            backgroundColor: theme.palette[color].main,
            width: 36,
            height: 36
          }}>
            {React.cloneElement(icon, { sx: { fontSize: '1.25rem' } })}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              color="textSecondary" 
              sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
              noWrap
            >
              {title}
            </Typography>
            <Typography 
              variant="h6" 
              fontWeight={700}
              color={`${color}.main`}
              sx={{ fontSize: '1.25rem', lineHeight: 1.2 }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                color="text.disabled"
                sx={{ fontSize: '0.625rem' }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  // Collapsible section component
  const CollapsibleSection = ({ title, icon, children, sectionKey, defaultExpanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    
    return (
      <Card 
        elevation={0} 
        sx={{ 
          mb: 2, 
          borderRadius: '12px', 
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            cursor: 'pointer',
            borderBottom: isExpanded ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none'
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ 
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 32,
                height: 32
              }}>
                {React.cloneElement(icon, { sx: { fontSize: '1rem' } })}
              </Avatar>
              <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                {title}
              </Typography>
            </Stack>
            <IconButton size="small">
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Stack>
        </Box>
        <Collapse in={isExpanded}>
          <Box sx={{ p: 2 }}>
            {children}
          </Box>
        </Collapse>
      </Card>
    );
  };

  // Mobile progress bar
  const MobileProgressBar = ({ label, value, total, color = 'primary' }) => (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
          {value}
        </Typography>
      </Stack>
      <Box sx={{ 
        width: '100%', 
        height: 6, 
        backgroundColor: alpha(theme.palette.divider, 0.1), 
        borderRadius: '3px' 
      }}>
        <Box
          sx={{
            width: `${total > 0 ? (value / total) * 100 : 0}%`,
            height: '100%',
            backgroundColor: theme.palette[color].main,
            borderRadius: '3px',
            transition: 'width 0.3s ease'
          }}
        />
      </Box>
    </Box>
  );

  if (isLoading) {
    return (
      <Box sx={{ px: 1 }}>
        {/* Mobile loading skeletons */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={6} key={index}>
              <Card elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <CardContent sx={{ p: 2 }}>
                  <Skeleton height={80} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} elevation={0} sx={{ mb: 2, borderRadius: '12px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <CardContent>
              <Skeleton height={120} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1 }}>
      {/* Mobile Controls */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: '12px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <CardContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* Timeframe Filter */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ 
                backgroundColor: alpha(theme.palette.info.main, 0.1), 
                color: theme.palette.info.main,
                width: 32,
                height: 32
              }}>
                <FilterList sx={{ fontSize: '1rem' }} />
              </Avatar>
              <TextField
                select
                size="small"
                label="Timeframe"
                value={analyticsTimeframe}
                onChange={(e) => setAnalyticsTimeframe(e.target.value)}
                sx={{ 
                  flex: 1,
                  '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                }}
              >
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="90">Last 3 months</MenuItem>
                <MenuItem value="365">Last year</MenuItem>
              </TextField>
            </Stack>

            <Divider />

            {/* Export and Refresh Controls */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Avatar sx={{ 
                  backgroundColor: alpha(theme.palette.success.main, 0.1), 
                  color: theme.palette.success.main,
                  width: 28,
                  height: 28
                }}>
                  <GetApp sx={{ fontSize: '0.875rem' }} />
                </Avatar>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                  Quick Actions
                </Typography>
              </Stack>
              
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    startIcon={<TableChart />}
                    onClick={() => handleExportCSV('analytics')}
                    sx={{ 
                      borderRadius: '6px', 
                      textTransform: 'none', 
                      fontSize: '0.625rem',
                      py: 0.5
                    }}
                  >
                    CSV
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    startIcon={<PictureAsPdf />}
                    onClick={handleExportPDF}
                    sx={{ 
                      borderRadius: '6px', 
                      textTransform: 'none', 
                      fontSize: '0.625rem',
                      py: 0.5
                    }}
                  >
                    PDF
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRefreshData}
                    sx={{ 
                      borderRadius: '6px', 
                      textTransform: 'none', 
                      fontSize: '0.625rem',
                      py: 0.5
                    }}
                  >
                    Refresh
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Overview Statistics - Mobile Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <MobileStatCard
            icon={<Analytics />}
            title="Total Requests"
            value={analyticsData?.overview?.total_requests || 0}
            color="primary"
          />
        </Grid>
        <Grid item xs={6}>
          <MobileStatCard
            icon={<Add />}
            title={`Recent (${analyticsTimeframe}d)`}
            value={analyticsData?.overview?.recent_requests || 0}
            color="success"
          />
        </Grid>
        <Grid item xs={6}>
          <MobileStatCard
            icon={<People />}
            title="Active Users"
            value={systemMetrics?.user_activity?.active_users || 0}
            color="warning"
            subtitle="30 days"
          />
        </Grid>
        <Grid item xs={6}>
          <MobileStatCard
            icon={<Timeline />}
            title="Avg. Time"
            value={`${analyticsData?.overview?.avg_completion_time || 0}d`}
            color="info"
            subtitle="completion"
          />
        </Grid>
      </Grid>

      {/* Status Breakdown */}
      <CollapsibleSection
        title="Request Status"
        icon={<Assessment />}
        sectionKey="status"
        defaultExpanded={true}
      >
        {analyticsData?.status_breakdown?.length > 0 ? (
          analyticsData.status_breakdown.map((status) => (
            <MobileProgressBar
              key={status.status}
              label={status.status.charAt(0).toUpperCase() + status.status.slice(1)}
              value={status.count}
              total={analyticsData?.overview?.total_requests || 1}
              color={status.status === 'completed' ? 'success' : 
                     status.status === 'in_progress' ? 'primary' : 'warning'}
            />
          ))
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
            No status data available
          </Typography>
        )}
      </CollapsibleSection>

      {/* Request Type Distribution */}
      <CollapsibleSection
        title="Request Types"
        icon={<Business />}
        sectionKey="types"
      >
        {analyticsData?.type_breakdown?.length > 0 ? (
          analyticsData.type_breakdown.map((type) => (
            <MobileProgressBar
              key={type.request_type}
              label={type.request_type.charAt(0).toUpperCase() + type.request_type.slice(1)}
              value={type.count}
              total={analyticsData?.overview?.total_requests || 1}
              color="secondary"
            />
          ))
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
            No type data available
          </Typography>
        )}
      </CollapsibleSection>

      {/* Top Performers */}
      <CollapsibleSection
        title="Top Performers"
        icon={<TrendingUp />}
        sectionKey="performers"
      >
        {analyticsData?.top_performers?.length > 0 ? (
          <Stack spacing={1.5}>
            {analyticsData.top_performers.map((performer, index) => (
              <Paper 
                key={performer.assigned_to} 
                elevation={0}
                sx={{ 
                  p: 1.5, 
                  backgroundColor: alpha(theme.palette.success.main, 0.05),
                  borderRadius: '8px',
                  border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Badge 
                    badgeContent={index + 1} 
                    color="success"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.625rem',
                        height: '16px',
                        minWidth: '16px'
                      }
                    }}
                  >
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32, 
                      fontSize: '0.75rem',
                      backgroundColor: theme.palette.success.main
                    }}>
                      {performer.assignedUser?.name?.charAt(0) || '?'}
                    </Avatar>
                  </Badge>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.75rem' }} noWrap>
                      {performer.assignedUser?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.625rem' }}>
                      {performer.assignedUser?.department || 'No department'}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${performer.dataValues?.completed_count || 0}`}
                    size="small"
                    color="success"
                    sx={{ 
                      borderRadius: '6px', 
                      fontWeight: 600,
                      fontSize: '0.625rem',
                      height: '20px'
                    }}
                  />
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
            No completed requests yet
          </Typography>
        )}
      </CollapsibleSection>

      {/* Department Workload */}
      <CollapsibleSection
        title="Department Workload"
        icon={<Business />}
        sectionKey="departments"
      >
        {analyticsData?.department_breakdown?.length > 0 ? (
          analyticsData.department_breakdown.map((dept) => {
            const maxCount = Math.max(...(analyticsData?.department_breakdown?.map(d => d.count) || [1]));
            return (
              <MobileProgressBar
                key={dept.department}
                label={dept.department || 'Unassigned'}
                value={dept.count}
                total={maxCount}
                color="secondary"
              />
            );
          })
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
            No department assignments yet
          </Typography>
        )}
      </CollapsibleSection>
    </Box>
  );
};

export default MobileReportsSection;