import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../components/NotificationProvider';
import LoadingSpinner from '../../components/LoadingSpinner';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../../utils/responsive';

const AdminSettingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    systemMaintenance: false,
    autoBackup: true,
    emailNotifications: true,
    smsNotifications: false,
    auditLogging: true,
    realTimeUpdates: true,
    apiRateLimit: '1000',
    sessionTimeout: '30',
    passwordPolicy: 'strong',
    twoFactorAuth: false,
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      // Here you would typically save settings to the server
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      showSuccess('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            setSettings({
              systemMaintenance: false,
              autoBackup: true,
              emailNotifications: true,
              smsNotifications: false,
              auditLogging: true,
              realTimeUpdates: true,
              apiRateLimit: '1000',
              sessionTimeout: '30',
              passwordPolicy: 'strong',
              twoFactorAuth: false,
            });
            showSuccess('Settings reset to defaults');
          }
        }
      ]
    );
  };

  const SettingItem = ({ title, description, value, onValueChange, type = 'switch' }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <View style={styles.settingControl}>
        {type === 'switch' ? (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={value ? theme.colors.white : theme.colors.textMuted}
          />
        ) : type === 'input' ? (
          <TextInput
            style={styles.settingInput}
            value={value}
            onChangeText={onValueChange}
            keyboardType="numeric"
          />
        ) : (
          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingButtonText}>{value}</Text>
            <Ionicons name="chevron-down" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const SettingSection = ({ title, children }) => (
    <View style={styles.settingSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Saving settings..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>System Settings</Text>
            <Text style={styles.headerSubtitle}>
              Configure system preferences and security settings
            </Text>
          </View>
        </View>

        {/* System Settings */}
        <SettingSection title="System Configuration">
          <SettingItem
            title="System Maintenance Mode"
            description="Enable maintenance mode to restrict access during updates"
            value={settings.systemMaintenance}
            onValueChange={(value) => handleSettingChange('systemMaintenance', value)}
          />
          <SettingItem
            title="Automatic Backup"
            description="Automatically backup system data daily"
            value={settings.autoBackup}
            onValueChange={(value) => handleSettingChange('autoBackup', value)}
          />
          <SettingItem
            title="Real-time Updates"
            description="Enable real-time data synchronization"
            value={settings.realTimeUpdates}
            onValueChange={(value) => handleSettingChange('realTimeUpdates', value)}
          />
        </SettingSection>

        {/* Notification Settings */}
        <SettingSection title="Notifications">
          <SettingItem
            title="Email Notifications"
            description="Send system notifications via email"
            value={settings.emailNotifications}
            onValueChange={(value) => handleSettingChange('emailNotifications', value)}
          />
          <SettingItem
            title="SMS Notifications"
            description="Send critical alerts via SMS"
            value={settings.smsNotifications}
            onValueChange={(value) => handleSettingChange('smsNotifications', value)}
          />
        </SettingSection>

        {/* Security Settings */}
        <SettingSection title="Security">
          <SettingItem
            title="Audit Logging"
            description="Log all user actions and system events"
            value={settings.auditLogging}
            onValueChange={(value) => handleSettingChange('auditLogging', value)}
          />
          <SettingItem
            title="Two-Factor Authentication"
            description="Require 2FA for admin accounts"
            value={settings.twoFactorAuth}
            onValueChange={(value) => handleSettingChange('twoFactorAuth', value)}
          />
          <SettingItem
            title="Password Policy"
            description="Set password complexity requirements"
            value={settings.passwordPolicy}
            onValueChange={(value) => handleSettingChange('passwordPolicy', value)}
            type="select"
          />
        </SettingSection>

        {/* API Settings */}
        <SettingSection title="API Configuration">
          <SettingItem
            title="Rate Limit (requests/hour)"
            description="Maximum API requests per hour per user"
            value={settings.apiRateLimit}
            onValueChange={(value) => handleSettingChange('apiRateLimit', value)}
            type="input"
          />
          <SettingItem
            title="Session Timeout (minutes)"
            description="Automatic logout after inactivity"
            value={settings.sessionTimeout}
            onValueChange={(value) => handleSettingChange('sessionTimeout', value)}
            type="input"
          />
        </SettingSection>

        {/* Database Settings */}
        <SettingSection title="Database">
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="server-outline" size={responsiveFontSize(20)} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Database Status</Text>
            <Ionicons name="chevron-forward" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="refresh-outline" size={responsiveFontSize(20)} color={theme.colors.success} />
            <Text style={styles.actionButtonText}>Optimize Database</Text>
            <Ionicons name="chevron-forward" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download-outline" size={responsiveFontSize(20)} color={theme.colors.warning} />
            <Text style={styles.actionButtonText}>Export Database</Text>
            <Ionicons name="chevron-forward" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </SettingSection>

        {/* System Actions */}
        <SettingSection title="System Actions">
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="refresh-outline" size={responsiveFontSize(20)} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Clear Cache</Text>
            <Ionicons name="chevron-forward" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="trash-outline" size={responsiveFontSize(20)} color={theme.colors.danger} />
            <Text style={styles.actionButtonText}>Clear Logs</Text>
            <Ionicons name="chevron-forward" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="refresh-outline" size={responsiveFontSize(20)} color={theme.colors.warning} />
            <Text style={styles.actionButtonText}>Restart Services</Text>
            <Ionicons name="chevron-forward" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </SettingSection>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={saveSettings}
            disabled={loading}
          >
            <Ionicons name="save-outline" size={responsiveFontSize(20)} color={theme.colors.white} />
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={resetSettings}
          >
            <Ionicons name="refresh-outline" size={responsiveFontSize(20)} color={theme.colors.danger} />
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  settingSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingTitle: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  settingControl: {
    alignItems: 'flex-end',
  },
  settingInput: {
    ...theme.typography.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minWidth: responsiveWidth(80),
    textAlign: 'center',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    minWidth: responsiveWidth(100),
  },
  settingButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginRight: theme.spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  actionButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  actionButtons: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  saveButtonText: {
    ...theme.typography.body,
    color: theme.colors.white,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  resetButtonText: {
    ...theme.typography.body,
    color: theme.colors.danger,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default AdminSettingsScreen;
