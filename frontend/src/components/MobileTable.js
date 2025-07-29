import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Stack,
  IconButton,
  Collapse,
  Button,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as ViewIcon,
  Assignment as AssignIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../hooks/useResponsive';

const MobileRequestCard = ({ 
  request, 
  onView, 
  onAssign, 
  showAssignButton = false,
  expanded = false,
  onToggleExpand 
}) => {
  const { t } = useTranslation();
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'on_hold': return 'default';
      default: return 'default';
    }
  };
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };
  
  const getRequestTypeColor = (type) => {
    switch (type) {
      case 'event': return '#1976d2';
      case 'web': return '#388e3c';
      case 'technical': return '#f57c00';
      case 'graphic': return '#7b1fa2';
      default: return '#757575';
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        position: 'relative',
        borderLeft: `4px solid ${getRequestTypeColor(request.requestType)}`,
        backgroundColor: request.hasRecentActivity ? 
          (theme) => theme.palette.primary.main + '08' : 'inherit'
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 'bold',
                color: request.hasRecentActivity ? 'primary.main' : 'inherit'
              }}
            >
              {request.requestNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t(`requests.types.${request.requestType}.title`)}
            </Typography>
          </Box>
          <Chip
            label={t(`requests.status.${request.status}`)}
            color={getStatusColor(request.status)}
            size="small"
          />
        </Box>

        {/* Main Info */}
        <Stack spacing={1}>
          <Typography variant="body2" noWrap>
            <strong>{t('dashboard.assignedTo')}:</strong> {request.assignedUser?.name || t('dashboard.noRequests')}
          </Typography>
          <Typography variant="body2">
            <strong>{t('dashboard.createdDate')}:</strong> {formatDate(request.createdAt)}
          </Typography>
        </Stack>

        {/* Collapsible Details */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>{t('auth.name')}:</strong> {request.name}
              </Typography>
              <Typography variant="body2">
                <strong>{t('auth.email')}:</strong> {request.email}
              </Typography>
              <Typography variant="body2">
                <strong>{t('requests.urgency.label')}:</strong> {t(`requests.urgency.${request.urgency}`)}
              </Typography>
              {request.dueDate && (
                <Typography variant="body2">
                  <strong>{t('requests.dueDate')}:</strong> {formatDate(request.dueDate)}
                </Typography>
              )}
            </Stack>
          </Box>
        </Collapse>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<ViewIcon />}
              onClick={() => onView(request.id)}
              size="small"
              variant="outlined"
            >
              {t('dashboard.viewDetails')}
            </Button>
            {showAssignButton && (
              <Button
                startIcon={<AssignIcon />}
                onClick={() => onAssign(request)}
                size="small"
                variant="contained"
                color="primary"
              >
                {t('dashboard.assignRequest')}
              </Button>
            )}
          </Box>
          <IconButton onClick={onToggleExpand} size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

const MobileTable = ({ 
  requests = [], 
  onView, 
  onAssign, 
  showAssignButton = false,
  loading = false 
}) => {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const [expandedCards, setExpandedCards] = React.useState(new Set());

  const handleToggleExpand = (requestId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedCards(newExpanded);
  };

  if (!isMobile) {
    return null; // Don't render on desktop - use regular table
  }

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t('common.loading')}
        </Typography>
      </Box>
    );
  }

  if (requests.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.noRequests')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1 }}>
      {requests.map((request) => (
        <MobileRequestCard
          key={request.id}
          request={request}
          onView={onView}
          onAssign={onAssign}
          showAssignButton={showAssignButton}
          expanded={expandedCards.has(request.id)}
          onToggleExpand={() => handleToggleExpand(request.id)}
        />
      ))}
    </Box>
  );
};

export default MobileTable;