import { useTheme, useMediaQuery } from '@mui/material';

export const useResponsive = () => {
  const theme = useTheme();
  
  // Fixed breakpoint logic - down('sm') means 0-479px, down('md') means 0-767px  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // 0-479px (xs)
  const isLargePhone = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 480-767px (sm)
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 768-1023px (md)
  const isDesktop = useMediaQuery(theme.breakpoints.between('lg', 'xl')); // 1024-1439px (lg)
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('xl')); // 1440px+ (xl)
  
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
    return isTablet || isDesktop || isLargeScreen;
  };
  
  const getContainerMaxWidth = () => {
    if (isMobile) return 'xs';        // 0-479px
    if (isLargePhone) return 'sm';    // 480-767px
    if (isTablet) return 'md';        // 768-1023px
    if (isDesktop) return 'lg';       // 1024-1439px
    if (isLargeScreen) return 'xl';   // 1440px+
    // Fallback for desktop - if none of the above match, default to large
    return 'lg';
  };
  
  // iPhone 15 Plus specific optimizations - only show mobile cards for screens under 768px
  const isIPhoneStyle = () => {
    // More explicit: use mobile cards only for screens smaller than tablet (768px)
    const result = useMediaQuery(theme.breakpoints.down('md')); // 0-767px
    
    // Debug logging - remove in production
    if (typeof window !== 'undefined') {
      console.log('Responsive Debug:', {
        screenWidth: window.innerWidth,
        isMobile,
        isLargePhone,
        isTablet,
        isDesktop,
        isLargeScreen,
        isIPhoneStyle: result,
        mdBreakpoint: theme.breakpoints.values.md
      });
    }
    return result;
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