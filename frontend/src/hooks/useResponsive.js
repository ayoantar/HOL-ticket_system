import { useTheme, useMediaQuery } from '@mui/material';

export const useResponsive = () => {
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // 0-479px
  const isLargePhone = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 480-767px  
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 768-1023px
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg')); // 1024px+
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('xl')); // 1440px+
  
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
  
  const getSpacing = (mobile = 2, largePhone = 3, tablet = 4, desktop = 5) => {
    if (isMobile) return mobile;
    if (isLargePhone) return largePhone;
    if (isTablet) return tablet;
    return desktop;
  };
  
  const getFontSize = (mobile = '0.875rem', largePhone = '1rem', tablet = '1.125rem', desktop = '1.25rem') => {
    if (isMobile) return mobile;
    if (isLargePhone) return largePhone;
    if (isTablet) return tablet;
    return desktop;
  };
  
  const getTableSize = () => {
    return (isMobile || isLargePhone) ? 'small' : 'medium';
  };
  
  const shouldShowDrawer = () => {
    return isTablet || isDesktop;
  };
  
  const getContainerMaxWidth = () => {
    if (isMobile) return 'xs';
    if (isLargePhone) return 'sm';
    if (isTablet) return 'md';
    if (isDesktop) return 'lg';
    return 'xl';
  };
  
  // iPhone 15 Plus specific optimizations
  const isIPhoneStyle = () => {
    return isMobile || isLargePhone;
  };
  
  return {
    // Boolean flags
    isMobile,
    isLargePhone,
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
    isIPhoneStyle,
    
    // Theme breakpoints for direct use
    theme
  };
};

export default useResponsive;