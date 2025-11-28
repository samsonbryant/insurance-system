import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../components/LoadingSpinner';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveFontSize, responsiveWidth, responsiveHeight } from '../../utils/responsive';

const LoadingScreen = ({ message = 'Loading application...' }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons 
            name="shield-checkmark" 
            size={responsiveFontSize(80)} 
            color={theme.colors.primary} 
          />
        </View>
        
        <Text style={styles.title}>IVAS</Text>
        <Text style={styles.subtitle}>Insurance Verification & Authentication System</Text>
        
        <LoadingSpinner 
          size="large" 
          color={theme.colors.primary} 
          text={message}
          style={styles.loader}
        />
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Securing your insurance verification process</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  logoContainer: {
    width: responsiveWidth(120),
    height: responsiveHeight(120),
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    maxWidth: responsiveWidth(300),
  },
  loader: {
    marginTop: theme.spacing.lg,
  },
  footer: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LoadingScreen;
