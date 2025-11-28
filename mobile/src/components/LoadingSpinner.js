import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { responsiveFontSize, responsiveWidth, responsiveHeight } from '../utils/responsive';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = theme.colors.primary, 
  text = 'Loading...',
  showText = true,
  style = {}
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  // Use native driver only on native platforms, not web
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    // Spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver,
      })
    );

    // Pulsing animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, [spinValue, pulseValue, useNativeDriver]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSize = () => {
    switch (size) {
      case 'small':
        return responsiveFontSize(20);
      case 'large':
        return responsiveFontSize(40);
      default:
        return responsiveFontSize(30);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.spinnerContainer,
          {
            transform: [
              { rotate: spin },
              { scale: pulseValue }
            ],
          },
        ]}
      >
        <Ionicons
          name="refresh"
          size={getSize()}
          color={color}
        />
      </Animated.View>
      
      {showText && text && (
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: pulseValue.interpolate({
                inputRange: [1, 1.2],
                outputRange: [0.7, 1],
              }),
            },
          ]}
        >
          <Text style={[styles.text, { color }]}>{text}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const LoadingOverlay = ({ 
  visible = false, 
  text = 'Loading...', 
  backgroundColor = 'rgba(0, 0, 0, 0.5)' 
}) => {
  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor }]}>
      <View style={styles.overlayContent}>
        <LoadingSpinner size="large" text={text} />
      </View>
    </View>
  );
};

const LoadingCard = ({ 
  text = 'Loading content...',
  style = {}
}) => {
  return (
    <View style={[styles.card, style]}>
      <LoadingSpinner size="medium" text={text} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  text: {
    ...theme.typography.body,
    fontWeight: '500',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: responsiveWidth(200),
    minHeight: responsiveHeight(150),
    ...theme.shadows.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: responsiveHeight(120),
    ...theme.shadows.md,
  },
});

export { LoadingOverlay, LoadingCard };
export default LoadingSpinner;
