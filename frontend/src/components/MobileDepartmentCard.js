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
  Badge
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const MobileDepartmentCard = ({ 
  department, 
  onEdit, 
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

  const getEmployeeCount = () => {
    return department.employees ? department.employees.length : 0;
  };

  const getDepartmentLead = () => {
    if (!department.employees) return null;
    return department.employees.find(emp => emp.role === 'dept_lead');
  };

  const lead = getDepartmentLead();
  const employeeCount = getEmployeeCount();

  return (
    <Card 
      sx={{ 
        mb: 2, 
        position: 'relative',
        borderLeft: `4px solid ${theme.palette.primary.main}`,
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
            <Badge badgeContent={employeeCount} color="primary" max={99}>
              <Avatar sx={{ backgroundColor: theme.palette.primary.main, width: 48, height: 48 }}>
                <BusinessIcon />
              </Avatar>
            </Badge>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {department.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {department.description}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              label={`${employeeCount} members`}
              color="primary"
              size="small"
              variant="outlined"
              sx={{ borderRadius: '8px', fontWeight: 500 }}
            />
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Department Lead */}
        {lead && (
          <Box sx={{ mb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2">
                <strong>Lead:</strong> {lead.name}
              </Typography>
              <Chip
                label="Lead"
                color="info"
                size="small"
                sx={{ height: '20px', fontSize: '0.6rem' }}
              />
            </Stack>
          </Box>
        )}

        {/* Collapsible Details */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Department Members ({employeeCount}):
                </Typography>
                {department.employees && department.employees.length > 0 ? (
                  <Stack spacing={1}>
                    {department.employees.map((employee) => (
                      <Box key={employee.id} sx={{ pl: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {employee.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{employee.name}</Typography>
                          <Chip
                            label={employee.role === 'dept_lead' ? 'Lead' : 'Employee'}
                            color={employee.role === 'dept_lead' ? 'info' : 'success'}
                            size="small"
                            sx={{ height: '18px', fontSize: '0.6rem' }}
                          />
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', pl: 2 }}>
                    No employees assigned to this department
                  </Typography>
                )}
              </Box>
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
          <MenuItem onClick={() => { onEdit(department); handleMenuClose(); }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Department</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={() => { onDelete(department.id); handleMenuClose(); }}
            sx={{ color: theme.palette.error.main }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Department</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

const MobileDepartmentTable = ({ 
  departments = [], 
  loading = false,
  onEdit,
  onDelete
}) => {
  const [expandedCards, setExpandedCards] = useState(new Set());

  const handleToggleExpand = (departmentId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedCards(newExpanded);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading departments...
        </Typography>
      </Box>
    );
  }

  if (departments.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No departments found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1 }}>
      {departments.map((department) => (
        <MobileDepartmentCard
          key={department.id}
          department={department}
          onEdit={onEdit}
          onDelete={onDelete}
          expanded={expandedCards.has(department.id)}
          onToggleExpand={() => handleToggleExpand(department.id)}
        />
      ))}
    </Box>
  );
};

export default MobileDepartmentTable;