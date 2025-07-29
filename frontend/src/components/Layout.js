import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  ConfirmationNumber,
  Add,
  Notifications,
  AdminPanelSettings,
  ExitToApp,
  Assignment
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel';
import LanguageSwitcher from './LanguageSwitcher';
import { useResponsive } from '../hooks/useResponsive';

const drawerWidth = 240;

const Layout = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const { isMobile, isLargePhone, isIPhoneStyle } = useResponsive();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: t('navigation.dashboard'), icon: <Dashboard />, path: '/dashboard' },
    { text: t('navigation.newRequest'), icon: <Assignment />, path: '/requests/new' },
  ];

  if (isAdmin) {
    menuItems.push({ text: t('navigation.adminPanel'), icon: <AdminPanelSettings />, path: '/admin' });
  }

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          {t('navigation.housesOfLight')}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` }, // Only offset on tablets and up
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' }, // Show on mobile and large phones, hide on tablets+
              '& .MuiSvgIcon-root': {
                fontSize: isLargePhone ? '1.75rem' : '1.5rem'
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user?.company || t('navigation.housesOfLight')}
          </Typography>
          
          {/* Language Switcher */}
          <LanguageSwitcher color="inherit" size={isIPhoneStyle() ? 'medium' : 'large'} />
          
          <IconButton color="inherit" onClick={() => setNotificationOpen(true)}>
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton
            onClick={handleProfileMenuOpen}
            size="large"
            edge="end"
            color="inherit"
          >
            <Avatar>{user?.name?.charAt(0)}</Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.name}</Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption">{user?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              {t('navigation.logout')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' }, // Show on phones and large phones
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              // Better touch targets on mobile
              '& .MuiListItem-root': {
                minHeight: isIPhoneStyle() ? '56px' : '48px',
              }
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' }, // Show only on tablets and up
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 }, // Responsive padding
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, sm: 8, md: 8 }, // Consistent top margin
          minHeight: 'calc(100vh - 64px)', // Ensure full height
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Outlet />
      </Box>
      
      <NotificationPanel open={notificationOpen} onClose={() => setNotificationOpen(false)} />
    </Box>
  );
};

export default Layout;