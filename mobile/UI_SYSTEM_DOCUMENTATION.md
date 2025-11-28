# IVAS Mobile UI System Documentation

## Overview
This document provides comprehensive documentation for the Insurance Verification & Authentication System (IVAS) mobile application's UI system. The system has been completely redesigned with modern, responsive components, real-time functionality, and enhanced user experience.

## Table of Contents
1. [Architecture](#architecture)
2. [Theme System](#theme-system)
3. [Responsive Design](#responsive-design)
4. [Component Library](#component-library)
5. [Real-time Features](#real-time-features)
6. [Navigation](#navigation)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Architecture

### Core Files Structure
```
mobile/src/
├── styles/
│   └── theme.js                 # Centralized theme system
├── utils/
│   └── responsive.js           # Responsive design utilities
├── components/
│   ├── LoadingSpinner.js       # Loading components
│   └── NotificationProvider.js # Notification system
├── services/
│   └── realTimeService.js      # Real-time communication
└── screens/
    ├── auth/
    ├── admin/
    ├── officer/
    └── common/
```

### Design Principles
- **Consistency**: All components use the centralized theme system
- **Responsiveness**: Adaptive layouts for all screen sizes
- **Accessibility**: Proper touch targets and screen reader support
- **Performance**: Optimized animations and efficient rendering
- **Real-time**: Live updates and connection status indicators

## Theme System

### Colors
```javascript
colors: {
  primary: '#007AFF',           // Main brand color
  primaryLight: '#e3f2fd',     // Light primary variant
  secondary: '#6c757d',        // Secondary actions
  success: '#28a745',          // Success states
  danger: '#dc3545',           // Error states
  warning: '#ffc107',          // Warning states
  info: '#17a2b8',             // Information states
  background: '#f8f9fa',       // Main background
  surface: '#ffffff',          // Card/surface background
  surfaceSecondary: '#f8f9fa', // Secondary surface
  textPrimary: '#1a1a1a',      // Primary text
  textSecondary: '#666',       // Secondary text
  textMuted: '#999',           // Muted text
  textLight: '#ccc',           // Light text
  border: '#e1e5e9',           // Borders and dividers
}
```

### Typography
```javascript
typography: {
  h1: { fontSize: responsiveFontSize(32), fontWeight: 'bold' },
  h2: { fontSize: responsiveFontSize(24), fontWeight: 'bold' },
  h3: { fontSize: responsiveFontSize(20), fontWeight: 'bold' },
  h4: { fontSize: responsiveFontSize(18), fontWeight: '600' },
  body: { fontSize: responsiveFontSize(16), lineHeight: responsiveFontSize(24) },
  bodySmall: { fontSize: responsiveFontSize(14), lineHeight: responsiveFontSize(20) },
  caption: { fontSize: responsiveFontSize(12), lineHeight: responsiveFontSize(18) },
}
```

### Spacing
```javascript
spacing: {
  xs: 4,    // Extra small spacing
  sm: 8,    // Small spacing
  md: 16,   // Medium spacing
  lg: 24,   // Large spacing
  xl: 32,   // Extra large spacing
}
```

### Shadows
```javascript
shadows: {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 1.00, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.23, shadowRadius: 2.62, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 4.65, elevation: 8 },
}
```

## Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px (web only)

### Responsive Utilities
```javascript
// Width scaling
responsiveWidth(size)     // Scales width based on screen width
responsiveHeight(size)    // Scales height based on screen height
responsiveFontSize(size)  // Scales font size with moderation factor

// Device detection
isTablet                  // Boolean for tablet detection
isDesktop                 // Boolean for desktop web detection

// Layout utilities
getGridColumns(minWidth, spacing)  // Calculate grid columns
getCardWidth(spacing)              // Calculate card width
```

### Usage Examples
```javascript
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../utils/responsive';

const styles = StyleSheet.create({
  container: {
    width: responsiveWidth(300),
    height: responsiveHeight(200),
  },
  title: {
    fontSize: responsiveFontSize(24),
  },
});
```

## Component Library

### LoadingSpinner
Animated loading component with multiple variants.

```javascript
import LoadingSpinner, { LoadingOverlay, LoadingCard } from '../components/LoadingSpinner';

// Basic spinner
<LoadingSpinner size="medium" text="Loading..." />

// Overlay spinner
<LoadingOverlay visible={loading} text="Processing..." />

// Card spinner
<LoadingCard text="Loading content..." />
```

**Props:**
- `size`: 'small' | 'medium' | 'large'
- `color`: Custom color (defaults to theme.primary)
- `text`: Loading message
- `showText`: Boolean to show/hide text

### NotificationProvider
Toast notification system with multiple types.

```javascript
import { useNotifications } from '../components/NotificationProvider';

const { showSuccess, showError, showWarning, showInfo } = useNotifications();

// Usage
showSuccess('Operation completed successfully');
showError('Something went wrong');
showWarning('Please check your input');
showInfo('Additional information');
```

**Features:**
- Auto-dismiss after duration
- Smooth slide animations
- Multiple notification types
- Action buttons support
- Custom positioning

### Real-time Service
Socket.IO integration for live updates.

```javascript
import { useRealTime, useRealTimeEvents } from '../services/realTimeService';

// Connection status
const { isConnected, connectionError } = useRealTime(token);

// Event handling
const data = useRealTimeEvents(['verification_update', 'stats_update']);
```

## Real-time Features

### Connection Management
- Automatic connection on login
- Automatic disconnection on logout
- Connection status indicators
- Error handling and reconnection

### Event Types
- `verification_update`: New verification results
- `stats_update`: Dashboard statistics updates
- `user_status`: User online/offline status
- `system_notification`: System-wide notifications

### Implementation
```javascript
// In AuthContext
useEffect(() => {
  if (accessToken) {
    realTimeService.connect(accessToken);
  } else {
    realTimeService.disconnect();
  }
}, [accessToken]);

// In components
const { isConnected } = useRealTime(accessToken);
const verificationUpdates = useRealTimeEvents(['verification_update']);
```

## Navigation

### Screen Structure
```
AppNavigator
├── AuthStack
│   ├── LoginScreen
│   └── RegisterScreen
├── AdminStack
│   ├── AdminDashboardScreen
│   ├── AdminUsersScreen (Placeholder)
│   ├── AdminReportsScreen (Placeholder)
│   └── AdminSettingsScreen (Placeholder)
├── OfficerStack
│   ├── OfficerDashboardScreen
│   ├── VerifyDocumentScreen
│   ├── VerificationHistoryScreen
│   └── OfficerReportsScreen (Placeholder)
└── CommonStack
    ├── ProfileScreen
    ├── AboutScreen
    └── PlaceholderScreen
```

### Navigation Patterns
- **Tab Navigation**: Main app sections
- **Stack Navigation**: Screen hierarchies
- **Modal Navigation**: Overlays and forms
- **Drawer Navigation**: Settings and profile

## Best Practices

### Component Development
1. **Use Theme System**: Always import and use theme variables
2. **Responsive Design**: Use responsive utilities for all dimensions
3. **Accessibility**: Include proper accessibility props
4. **Performance**: Use FlatList for large lists, optimize images
5. **Error Handling**: Implement proper error boundaries

### Styling Guidelines
```javascript
// ✅ Good
const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
});

// ❌ Bad
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
});
```

### State Management
- Use Redux for global state
- Use local state for component-specific data
- Use context for theme and user data
- Implement proper loading and error states

### Performance Optimization
- Use `React.memo` for expensive components
- Implement proper key props for lists
- Optimize images with proper sizing
- Use lazy loading for heavy components

## Troubleshooting

### Common Issues

#### Theme Not Applied
**Problem**: Components not using theme colors
**Solution**: Ensure theme is imported and used correctly
```javascript
import { theme } from '../styles/theme';
// Use theme.colors.primary instead of hardcoded colors
```

#### Responsive Issues
**Problem**: Components not scaling properly
**Solution**: Use responsive utilities
```javascript
import { responsiveWidth, responsiveHeight } from '../utils/responsive';
// Use responsiveWidth(300) instead of width: 300
```

#### Real-time Connection Issues
**Problem**: Socket connection not working
**Solution**: Check token validity and network connectivity
```javascript
// Debug connection status
const { isConnected, connectionError } = useRealTime(token);
console.log('Connected:', isConnected, 'Error:', connectionError);
```

#### Notification Not Showing
**Problem**: Notifications not appearing
**Solution**: Ensure NotificationProvider wraps the app
```javascript
// In App.js
<NotificationProvider>
  <AuthProvider>
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  </AuthProvider>
</NotificationProvider>
```

### Performance Issues
- Check for unnecessary re-renders
- Optimize FlatList performance
- Use proper image optimization
- Implement proper loading states

### Debugging Tools
- React Native Debugger
- Flipper integration
- Console logging for real-time events
- Performance monitoring

## Future Enhancements

### Planned Features
1. **Dark Mode**: Complete dark theme implementation
2. **Offline Support**: Offline-first architecture
3. **Advanced Animations**: More sophisticated transitions
4. **Accessibility**: Enhanced screen reader support
5. **Internationalization**: Multi-language support

### Component Roadmap
- Advanced form components
- Data visualization charts
- Enhanced camera integration
- Biometric authentication UI
- Advanced filtering components

## Conclusion

The IVAS Mobile UI System provides a comprehensive, modern, and responsive user interface that enhances the user experience while maintaining consistency and performance. The system is designed to be scalable, maintainable, and accessible across all devices and platforms.

For questions or contributions, please refer to the development team or create an issue in the project repository.

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team
