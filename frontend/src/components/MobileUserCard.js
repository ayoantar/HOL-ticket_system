import React, { useState } from 'react';
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
  Divider,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Delete as DeleteIcon,
  AdminPanelSettings,
  Group,
  People
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useTheme } from '@mui/material/styles';

const MobileUserCard = ({ 
  user, 
  onEdit, 
  onResetPassword, 
  onToggleStatus, 
  onDelete,
  expanded = false,
  onToggleExpand 
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings />;
      case 'dept_lead': return <Group />;
      default: return <People />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return theme.palette.warning.main;
      case 'dept_lead': return theme.palette.info.main;
      case 'employee': return theme.palette.success.main;
      default: return theme.palette.primary.main;
    }
  };

  const getRoleChipColor = (role) => {
    switch (role) {
      case 'admin': return 'warning';
      case 'dept_lead': return 'info';
      case 'employee': return 'success';
      default: return 'primary';
    }
  };

  const formatRole = (role) => {
    return role === 'dept_lead' ? 'Department Lead' : role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        position: 'relative',
        borderLeft: `4px solid ${getRoleColor(user.role)}`,
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
            <Avatar sx={{ backgroundColor: getRoleColor(user.role), width: 48, height: 48 }}>
              {getRoleIcon(user.role)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              label={user.isActive ? 'Active' : 'Inactive'}
              color={user.isActive ? 'success' : 'error'}
              size="small"
              variant="outlined"
              sx={{ borderRadius: '8px', fontWeight: 500 }}
            />
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Role & Department */}
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip
            label={formatRole(user.role)}
            color={getRoleChipColor(user.role)}
            size="small"
            sx={{ borderRadius: '8px', fontWeight: 500 }}
          />
          {['employee', 'dept_lead'].includes(user.role) && user.department && (
            <Chip
              label={user.department}
              color="secondary"
              size="small"
              variant="outlined"
              sx={{ borderRadius: '8px', fontWeight: 500 }}
            />
          )}
        </Stack>

        {/* Collapsible Details */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Company:</strong> {user.company || 'No company'}
              </Typography>
              <Typography variant="body2">
                <strong>Created:</strong> {format(new Date(user.created_at), 'MMM dd, yyyy')}
              </Typography>
              {!['employee', 'dept_lead'].includes(user.role) && (
                <Typography variant="body2">
                  <strong>Department:</strong> Not applicable
                </Typography>
              )}
              {['employee', 'dept_lead'].includes(user.role) && !user.department && (
                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                  <strong>Department:</strong> No department assigned
                </Typography>
              )}
            </Stack>
          </Box>
        </Collapse>

        {/* Expand Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <IconButton onClick={onToggleExpand} size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={() => { onEdit(user); handleMenuClose(); }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit User</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { onResetPassword(user); handleMenuClose(); }}>
            <ListItemIcon>
              <LockIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reset Password</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { onToggleStatus(user.id, user.isActive); handleMenuClose(); }}>
            <ListItemIcon>
              {user.isActive ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{user.isActive ? 'Deactivate' : 'Activate'}</ListItemText>
          </MenuItem>
          {user.role !== 'admin' && (
            <MenuItem 
              onClick={() => { onDelete(user.id); handleMenuClose(); }}
              sx={{ color: theme.palette.error.main }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete User</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </CardContent>
    </Card>
  );
};

const MobileUserTable = ({ 
  users = [], 
  loading = false,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onDelete
}) => {
  const [expandedCards, setExpandedCards] = useState(new Set());

  const handleToggleExpand = (userId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedCards(newExpanded);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading users...
        </Typography>
      </Box>
    );
  }

  if (users.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No users found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1 }}>
      {users.map((user) => (
        <MobileUserCard
          key={user.id}
          user={user}
          onEdit={onEdit}
          onResetPassword={onResetPassword}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          expanded={expandedCards.has(user.id)}
          onToggleExpand={() => handleToggleExpand(user.id)}
        />
      ))}
    </Box>
  );
};

export default MobileUserTable;