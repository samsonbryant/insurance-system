import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Device type detection
export const isTablet = width >= 768;
export const isDesktop = width >= 1024;
export const isMobile = width < 768;

// Responsive dimensions
export const responsiveWidth = (mobileWidth, tabletWidth = mobileWidth * 1.2, desktopWidth = mobileWidth * 1.5) => {
  if (isDesktop) return desktopWidth;
  if (isTablet) return tabletWidth;
  return mobileWidth;
};

export const responsiveHeight = (mobileHeight, tabletHeight = mobileHeight * 1.1, desktopHeight = mobileHeight * 1.2) => {
  if (isDesktop) return desktopHeight;
  if (isTablet) return tabletHeight;
  return mobileHeight;
};

export const responsiveFontSize = (mobileSize, tabletSize = mobileSize * 1.1, desktopSize = mobileSize * 1.2) => {
  if (isDesktop) return desktopSize;
  if (isTablet) return tabletSize;
  return mobileSize;
};

// Grid system
export const getGridColumns = () => {
  if (isDesktop) return 3;
  if (isTablet) return 2;
  return 1;
};

export const getCardWidth = (padding = 20) => {
  const columns = getGridColumns();
  return (width - (padding * (columns + 1))) / columns;
};

// Platform specific styles
export const platformStyles = {
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  }),
  
  shadowLarge: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 5,
    },
  }),
};

// Layout helpers
export const layoutHelpers = {
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  flexWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
};

// Animation helpers
export const animationConfig = {
  spring: {
    tension: 100,
    friction: 8,
  },
  
  timing: {
    duration: 300,
  },
  
  timingSlow: {
    duration: 500,
  },
};

export default {
  width,
  height,
  isTablet,
  isDesktop,
  isMobile,
  responsiveWidth,
  responsiveHeight,
  responsiveFontSize,
  getGridColumns,
  getCardWidth,
  platformStyles,
  layoutHelpers,
  animationConfig,
};
