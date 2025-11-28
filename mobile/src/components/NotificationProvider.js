import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, Platform, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { responsiveFontSize, responsiveWidth, responsiveHeight } from '../utils/responsive';

const { width: screenWidth } = Dimensions.get('window');

const NotificationContext = React.createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [position, setPosition] = useState('top'); // 'top' or 'bottom'

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info', // 'success', 'error', 'warning', 'info'
      title: '',
      message: '',
      duration: 4000,
      action: null,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const showSuccess = (message, title = 'Success') => {
    return addNotification({ type: 'success', title, message });
  };

  const showError = (message, title = 'Error') => {
    return addNotification({ type: 'error', title, message });
  };

  const showWarning = (message, title = 'Warning') => {
    return addNotification({ type: 'warning', title, message });
  };

  const showInfo = (message, title = 'Info') => {
    return addNotification({ type: 'info', title, message });
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    setPosition,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification, position } = React.useContext(NotificationContext);

  if (notifications.length === 0) return null;

  return (
    <View style={[
      styles.container,
      position === 'top' ? styles.topContainer : styles.bottomContainer
    ]}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
          position={position}
        />
      ))}
    </View>
  );
};

const NotificationItem = ({ notification, onRemove, position }) => {
  const slideAnim = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Use native driver only on native platforms, not web
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver,
      }),
    ]).start();
  }, []);

  const handleRemove = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: 200,
        useNativeDriver,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver,
      }),
    ]).start(() => {
      onRemove(notification.id);
    });
  };

  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          borderLeftColor: '#1e7e34',
        };
      case 'error':
        return {
          backgroundColor: theme.colors.danger,
          borderLeftColor: '#bd2130',
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning,
          borderLeftColor: '#d39e00',
        };
      default:
        return {
          backgroundColor: theme.colors.info,
          borderLeftColor: '#138496',
        };
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  return (
    <Animated.View
      style={[
        styles.notification,
        getNotificationStyle(),
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.notificationContent}
        onPress={notification.action}
        activeOpacity={notification.action ? 0.7 : 1}
      >
        <View style={styles.notificationLeft}>
          <Ionicons
            name={getIcon()}
            size={responsiveFontSize(24)}
            color={theme.colors.surface}
          />
        </View>
        
        <View style={styles.notificationBody}>
          {notification.title && (
            <Text style={styles.notificationTitle}>{notification.title}</Text>
          )}
          <Text style={styles.notificationMessage}>{notification.message}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="close"
            size={responsiveFontSize(20)}
            color={theme.colors.surface}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 10000,
  },
  topContainer: {
    top: 0,
  },
  bottomContainer: {
    bottom: 0,
  },
  notification: {
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
    ...theme.shadows.md,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
  },
  notificationLeft: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  notificationBody: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  notificationTitle: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
    color: theme.colors.surface,
    marginBottom: 2,
  },
  notificationMessage: {
    ...theme.typography.bodySmall,
    color: theme.colors.surface,
    lineHeight: responsiveFontSize(18),
  },
  closeButton: {
    padding: theme.spacing.xs,
    marginTop: -theme.spacing.xs,
    marginRight: -theme.spacing.xs,
  },
});

export default NotificationProvider;
