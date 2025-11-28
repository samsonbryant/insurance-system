import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../components/NotificationProvider';
import LoadingSpinner from '../../components/LoadingSpinner';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../../utils/responsive';

const EditUserScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const { userId } = route.params;
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'officer',
    isActive: true,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // This would load user data from API
      // For now, using mock data
      setUserData({
        username: 'user' + userId,
        email: 'user' + userId + '@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+231-123-456-7890',
        role: 'officer',
        isActive: true,
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      showError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!userData.username || !userData.email) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      // This would call the actual API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      showSuccess('User updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating user:', error);
      showError('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, required = false }) => (
    <View style={styles.inputField}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading user data..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={responsiveFontSize(24)} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Edit User</Text>
            <Text style={styles.headerSubtitle}>Update user information</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputField
            label="Username"
            value={userData.username}
            onChangeText={(value) => handleInputChange('username', value)}
            placeholder="Enter username"
            required
          />

          <InputField
            label="Email"
            value={userData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="Enter email address"
            required
          />

          <InputField
            label="First Name"
            value={userData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
            placeholder="Enter first name"
          />

          <InputField
            label="Last Name"
            value={userData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
            placeholder="Enter last name"
          />

          <InputField
            label="Phone"
            value={userData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            placeholder="Enter phone number"
          />

          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.roleButtons}>
              {['admin', 'officer', 'company'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleButton,
                    userData.role === role && styles.roleButtonActive
                  ]}
                  onPress={() => handleInputChange('role', role)}
                >
                  <Text style={[
                    styles.roleButtonText,
                    userData.role === role && styles.roleButtonTextActive
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  userData.isActive && styles.statusButtonActive
                ]}
                onPress={() => handleInputChange('isActive', true)}
              >
                <Text style={[
                  styles.statusButtonText,
                  userData.isActive && styles.statusButtonTextActive
                ]}>
                  Active
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  !userData.isActive && styles.statusButtonActive
                ]}
                onPress={() => handleInputChange('isActive', false)}
              >
                <Text style={[
                  styles.statusButtonText,
                  !userData.isActive && styles.statusButtonTextActive
                ]}>
                  Inactive
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Ionicons name="checkmark" size={responsiveFontSize(20)} color={theme.colors.white} />
            <Text style={styles.submitButtonText}>Update User</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerContent: {
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
  form: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  inputField: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.danger,
  },
  input: {
    ...theme.typography.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  roleButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  roleButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  roleButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statusButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  statusButtonActive: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success + '10',
  },
  statusButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  statusButtonTextActive: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  submitButtonText: {
    ...theme.typography.body,
    color: theme.colors.white,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
});

export default EditUserScreen;
