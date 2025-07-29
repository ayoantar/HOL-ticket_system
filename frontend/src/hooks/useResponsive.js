import { useTheme, useMediaQuery } from '@mui/material';

export const useResponsive = () => {
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Specific breakpoints
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));
  
  // Mobile-first responsive utilities
  const getColumns = (xs = 12, sm = 6, md = 4, lg = 3, xl = 2) => {
    if (isXl) return xl;
    if (isLg) return lg;
    if (isMd) return md;
    if (isSm) return sm;
    return xs;
  };
  
  const getSpacing = (mobile = 2, tablet = 3, desktop = 4) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };
  
  const getFontSize = (mobile = '0.875rem', tablet = '1rem', desktop = '1.125rem') => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };
  
  const getTableSize = () => {
    return isMobile ? 'small' : 'medium';
  };
  
  const shouldShowDrawer = () => {
    return !isMobile;
  };
  
  const getContainerMaxWidth = () => {
    if (isMobile) return 'xs';
    if (isTablet) return 'sm';
    if (isDesktop) return 'md';
    return 'lg';
  };
  
  return {
    // Boolean flags
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    
    // Utility functions
    getColumns,
    getSpacing,
    getFontSize,
    getTableSize,
    shouldShowDrawer,
    getContainerMaxWidth,
    
    // Theme breakpoints for direct use
    theme
  };
};

export default useResponsive;