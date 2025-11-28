import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../../utils/responsive';

const PlaceholderScreen = ({ route, navigation }) => {
  const screenName = route?.name || 'Screen';
  
  const getScreenIcon = (name) => {
    const iconMap = {
      'AdminUsers': 'people',
      'AdminReports': 'bar-chart',
      'AdminSettings': 'settings',
      'CompanyDashboard': 'home',
      'CompanyPolicies': 'document-text',
      'CompanyReports': 'analytics',
      'CompanySettings': 'settings',
      'OfficerDashboard': 'home',
      'OfficerReports': 'bar-chart',
      'OfficerSettings': 'settings',
    };
    return iconMap[name] || 'construct';
  };

  const getScreenDescription = (name) => {
    const descriptionMap = {
      'AdminUsers': 'Manage system users, roles, and permissions',
      'AdminReports': 'View comprehensive system reports and analytics',
      'AdminSettings': 'Configure system settings and preferences',
      'CompanyDashboard': 'Overview of company policies and activities',
      'CompanyPolicies': 'Manage insurance policies and coverage',
      'CompanyReports': 'View company-specific reports and metrics',
      'CompanySettings': 'Configure company settings and preferences',
      'OfficerDashboard': 'Quick access to verification tools and stats',
      'OfficerReports': 'View verification history and performance',
      'OfficerSettings': 'Configure officer preferences and settings',
    };
    return descriptionMap[name] || 'This feature is currently under development';
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getScreenIcon(screenName)} 
            size={responsiveFontSize(80)} 
            color={theme.colors.primary} 
          />
        </View>
        
        {/* Title */}
        <Text style={styles.title}>{screenName.replace(/([A-Z])/g, ' $1').trim()}</Text>
        
        {/* Coming Soon Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming Soon</Text>
        </View>
        
        {/* Description */}
        <Text style={styles.description}>
          {getScreenDescription(screenName)}
        </Text>
        
        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Planned Features:</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.featureText}>Modern responsive design</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.featureText}>Real-time updates</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.featureText}>Enhanced user experience</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.featureText}>Advanced analytics</Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.surface} />
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="notifications" size={20} color={theme.colors.primary} />
            <Text style={styles.secondaryButtonText}>Notify Me</Text>
          </TouchableOpacity>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This feature will be available in the next update
          </Text>
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
  iconContainer: {
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
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    marginBottom: theme.spacing.lg,
  },
  badgeText: {
    ...theme.typography.bodySmall,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
    maxWidth: responsiveWidth(300),
  },
  featuresContainer: {
    width: '100%',
    maxWidth: responsiveWidth(300),
    marginBottom: theme.spacing.xl,
  },
  featuresTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  actionsContainer: {
    width: '100%',
    maxWidth: responsiveWidth(300),
    marginBottom: theme.spacing.xl,
  },
  primaryButton: {
    ...commonStyles.button,
    ...commonStyles.buttonPrimary,
    marginBottom: theme.spacing.md,
    minHeight: responsiveHeight(50),
  },
  primaryButtonText: {
    ...commonStyles.buttonText,
    marginLeft: theme.spacing.sm,
  },
  secondaryButton: {
    ...commonStyles.button,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    minHeight: responsiveHeight(50),
  },
  secondaryButtonText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PlaceholderScreen;
