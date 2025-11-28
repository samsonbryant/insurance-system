import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveFontSize, responsiveWidth, responsiveHeight } from '../../utils/responsive';
import { useNotifications } from '../../components/NotificationProvider';

const AboutScreen = ({ navigation }) => {
  const { showSuccess, showInfo } = useNotifications();
  const appVersion = '1.0.0';
  const buildNumber = '100';

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'For technical support, please contact:\n\nEmail: support@ivas.gov.lr\nPhone: +231-123-456-7890',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Email', 
          onPress: () => {
            Linking.openURL('mailto:support@ivas.gov.lr');
            showInfo('Opening email client...');
          }
        },
        { 
          text: 'Call', 
          onPress: () => {
            Linking.openURL('tel:+2311234567890');
            showInfo('Opening phone dialer...');
          }
        }
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'This app collects minimal data necessary for insurance verification. All data is encrypted and stored securely according to Liberian data protection laws.',
      [{ text: 'OK' }]
    );
  };

  const handleTermsOfService = () => {
    Alert.alert(
      'Terms of Service',
      'By using this app, you agree to use it responsibly and in accordance with Liberian law. Unauthorized use is prohibited.',
      [{ text: 'OK' }]
    );
  };

  const handleRateApp = () => {
    showInfo('Thank you for your feedback! Rating feature coming soon.');
  };

  const InfoItem = ({ icon, title, value, onPress, badge }) => (
    <TouchableOpacity 
      style={styles.infoItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.infoItemLeft}>
        <Ionicons name={icon} size={responsiveFontSize(24)} color={theme.colors.primary} />
        <Text style={styles.infoItemTitle}>{title}</Text>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.infoItemRight}>
        {value && <Text style={styles.infoItemValue}>{value}</Text>}
        {onPress && (
          <Ionicons name="chevron-forward" size={responsiveFontSize(20)} color={theme.colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={responsiveFontSize(24)} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>About</Text>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={responsiveFontSize(20)} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={responsiveFontSize(80)} color={theme.colors.primary} />
          </View>
          <Text style={styles.appName}>IVAS Mobile</Text>
          <Text style={styles.appDescription}>
            Insurance Verification & Authentication System
          </Text>
          <View style={styles.versionContainer}>
            <Text style={styles.appVersion}>Version {appVersion}</Text>
            <View style={styles.buildBadge}>
              <Text style={styles.buildText}>Build {buildNumber}</Text>
            </View>
          </View>
        </View>

        {/* App Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Application Information</Text>
          
          <InfoItem
            icon="information-circle-outline"
            title="Version"
            value={appVersion}
          />
          
          <InfoItem
            icon="build-outline"
            title="Build Number"
            value={buildNumber}
          />
          
          <InfoItem
            icon="calendar-outline"
            title="Release Date"
            value="December 2023"
          />
          
          <InfoItem
            icon="code-outline"
            title="Framework"
            value="React Native"
          />
        </View>

        {/* Legal */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <InfoItem
            icon="document-text-outline"
            title="Privacy Policy"
            value=""
            onPress={handlePrivacyPolicy}
          />
          
          <InfoItem
            icon="document-outline"
            title="Terms of Service"
            value=""
            onPress={handleTermsOfService}
          />
        </View>

        {/* Support */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <InfoItem
            icon="help-circle-outline"
            title="Help & FAQ"
            value=""
            onPress={() => Alert.alert('Coming Soon', 'Help & FAQ will be available soon')}
          />
          
          <InfoItem
            icon="mail-outline"
            title="Contact Support"
            value=""
            onPress={handleContactSupport}
          />
          
          <InfoItem
            icon="bug-outline"
            title="Report Bug"
            value=""
            onPress={() => Alert.alert('Coming Soon', 'Bug reporting will be available soon')}
          />
          
          <InfoItem
            icon="star-outline"
            title="Rate App"
            value=""
            onPress={handleRateApp}
          />
        </View>

        {/* Credits */}
        <View style={styles.creditsContainer}>
          <Text style={styles.creditsTitle}>Credits</Text>
          <Text style={styles.creditsText}>
            Developed for the Government of Liberia{'\n'}
            Ministry of Finance{'\n'}
            Insurance Commission
          </Text>
          <Text style={styles.copyrightText}>
            © 2023 Government of Liberia. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  shareButton: {
    padding: theme.spacing.sm,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
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
  appName: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  appDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    maxWidth: responsiveWidth(300),
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appVersion: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
    marginRight: theme.spacing.sm,
  },
  buildBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  buildText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  detailsContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: responsiveHeight(60),
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoItemTitle: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.md,
  },
  badge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  badgeText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  infoItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItemValue: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  creditsContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  creditsTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  creditsText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: responsiveFontSize(20),
    marginBottom: theme.spacing.md,
  },
  copyrightText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});

export default AboutScreen;
