import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../components/NotificationProvider';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveFontSize, responsiveWidth, responsiveHeight } from '../../utils/responsive';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    username: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || ''
      });
    }
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await logout();
              if (result.success) {
                showSuccess('Logged out successfully');
                // Force navigation reset to ensure proper redirect
                setTimeout(() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                }, 1000);
              } else {
                showError('Failed to logout. Please try again.');
              }
            } catch (error) {
              console.error('Logout error:', error);
              showError('Failed to logout. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      await updateProfile(formData);
      setShowEditModal(false);
      showSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      showError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      // Here you would call the API to change password
      // await changePassword(passwordData);
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showSuccess('Password changed successfully');
    } catch (error) {
      console.error('Password change error:', error);
      showError('Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationToggle = (value) => {
    setNotificationsEnabled(value);
    showInfo(value ? 'Notifications enabled' : 'Notifications disabled');
  };

  const handleDarkModeToggle = (value) => {
    setDarkModeEnabled(value);
    showInfo(value ? 'Dark mode enabled' : 'Dark mode disabled');
  };

  const ProfileItem = ({ icon, title, value, onPress, rightComponent }) => (
    <TouchableOpacity 
      style={styles.profileItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <Ionicons name={icon} size={responsiveFontSize(24)} color={theme.colors.primary} />
        <View style={styles.profileItemContent}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          <Text style={styles.profileItemValue}>{value}</Text>
        </View>
      </View>
      {rightComponent || (onPress && (
        <Ionicons name="chevron-forward" size={responsiveFontSize(20)} color={theme.colors.textMuted} />
      ))}
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
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={responsiveFontSize(20)} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={responsiveFontSize(80)} color={theme.colors.primary} />
          </View>
          <Text style={styles.userName}>
            {user?.first_name && user?.last_name 
              ? `${user.first_name} ${user.last_name}`
              : user?.username
            }
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.userRole}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </Text>
          </View>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.company && (
            <Text style={styles.userCompany}>{user.company.name}</Text>
          )}
        </View>

        {/* Profile Items */}
        <View style={styles.profileItems}>
          <ProfileItem
            icon="person-outline"
            title="Personal Information"
            value="Update your personal details"
            onPress={handleEditProfile}
          />
          
          <ProfileItem
            icon="lock-closed-outline"
            title="Change Password"
            value="Update your password"
            onPress={handleChangePassword}
          />
          
          <ProfileItem
            icon="notifications-outline"
            title="Notifications"
            value="Push notifications and alerts"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.textMuted}
              />
            }
          />
          
          <ProfileItem
            icon="moon-outline"
            title="Dark Mode"
            value="Switch to dark theme"
            rightComponent={
              <Switch
                value={darkModeEnabled}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={darkModeEnabled ? theme.colors.primary : theme.colors.textMuted}
              />
            }
          />
          
          <ProfileItem
            icon="shield-checkmark-outline"
            title="Security"
            value="Two-factor authentication"
            onPress={() => Alert.alert('Coming Soon', 'Security settings will be available soon')}
          />
          
          <ProfileItem
            icon="help-circle-outline"
            title="Help & Support"
            value="Get help and contact support"
            onPress={() => Alert.alert('Coming Soon', 'Help & support will be available soon')}
          />
          
          <ProfileItem
            icon="information-circle-outline"
            title="About"
            value="App version and information"
            onPress={() => navigation.navigate('About')}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, isLoading && styles.logoutButtonDisabled]} 
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Ionicons name="log-out-outline" size={responsiveFontSize(24)} color={theme.colors.danger} />
          <Text style={styles.logoutButtonText}>
            {isLoading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={isLoading}>
              <Text style={[styles.modalSaveButton, isLoading && styles.disabledButton]}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>First Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.first_name}
                  onChangeText={(text) => setFormData({...formData, first_name: text})}
                  placeholder="Enter first name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Last Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.last_name}
                  onChangeText={(text) => setFormData({...formData, last_name: text})}
                  placeholder="Enter last name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Username</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.username}
                  onChangeText={(text) => setFormData({...formData, username: text})}
                  placeholder="Enter username"
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <LoadingSpinner size="medium" text="Updating profile..." />
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={handleSavePassword} disabled={isLoading}>
              <Text style={[styles.modalSaveButton, isLoading && styles.disabledButton]}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Current Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                  placeholder="Enter current password"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>New Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                  placeholder="Enter new password"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                  placeholder="Confirm new password"
                  secureTextEntry
                />
              </View>

              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <Text style={styles.requirementItem}>• At least 6 characters long</Text>
                <Text style={styles.requirementItem}>• Mix of letters and numbers recommended</Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <LoadingSpinner size="medium" text="Changing password..." />
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
  editButton: {
    padding: theme.spacing.sm,
  },
  profileInfo: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
  },
  userName: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    marginBottom: theme.spacing.sm,
  },
  userRole: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  userEmail: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  userCompany: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  profileItems: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: responsiveHeight(60),
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemContent: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  profileItemTitle: {
    ...theme.typography.body,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  profileItemValue: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    minHeight: responsiveHeight(50),
    ...theme.shadows.sm,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
    borderColor: theme.colors.textMuted,
  },
  logoutButtonText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.danger,
    marginLeft: theme.spacing.sm,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
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
  modalCancelButton: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  modalSaveButton: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  disabledButton: {
    color: theme.colors.textMuted,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  formLabel: {
    ...theme.typography.body,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  formInput: {
    ...commonStyles.input,
    paddingVertical: theme.spacing.md,
    fontSize: responsiveFontSize(16),
    minHeight: responsiveHeight(50),
  },
  passwordRequirements: {
    backgroundColor: theme.colors.surfaceSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  requirementsTitle: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  requirementItem: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
