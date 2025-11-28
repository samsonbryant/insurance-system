// Theme configuration for IVAS
import { Platform } from 'react-native';

// Web-compatible shadow styles
const createShadow = (shadowConfig) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${shadowConfig.shadowOffset.width}px ${shadowConfig.shadowOffset.height}px ${shadowConfig.shadowRadius}px rgba(0, 0, 0, ${shadowConfig.shadowOpacity})`,
    };
  }
  return shadowConfig;
};

export const theme = {
  colors: {
    primary: '#007AFF',
    primaryDark: '#0056CC',
    primaryLight: '#E3F2FD',
    secondary: '#6C757D',
    success: '#28A745',
    warning: '#FFC107',
    danger: '#DC3545',
    info: '#17A2B8',
    
    // Background colors
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F3F4',
    
    // Text colors
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#999999',
    textLight: '#CCCCCC',
    
    // Border colors
    border: '#E1E5E9',
    borderLight: '#F0F0F0',
    borderDark: '#CCCCCC',
    
    // Status colors
    valid: '#28A745',
    fake: '#DC3545',
    expired: '#FFC107',
    pending: '#007AFF',
    notFound: '#6C757D',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
    },
  },
  
  shadows: {
    sm: createShadow({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    }),
    md: createShadow({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
    lg: createShadow({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    }),
  },
  
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
  },
};

// Responsive helper functions
export const isTablet = (width) => width >= theme.breakpoints.tablet;
export const isDesktop = (width) => width >= theme.breakpoints.desktop;

// Common styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  
  button: {
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  
  buttonSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  
  buttonSuccess: {
    backgroundColor: theme.colors.success,
  },
  
  buttonDanger: {
    backgroundColor: theme.colors.danger,
  },
  
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
  },
  
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
  },
  
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  
  textPrimary: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  
  textSecondary: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  
  textMuted: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  
  header: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
};

export default theme;
