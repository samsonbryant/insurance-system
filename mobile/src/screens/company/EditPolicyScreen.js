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

const EditPolicyScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const { policyId } = route.params;
  const [loading, setLoading] = useState(false);
  const [policyData, setPolicyData] = useState({
    policy_number: '',
    holder_name: '',
    holder_id_number: '',
    holder_phone: '',
    holder_email: '',
    policy_type: 'auto',
    coverage_amount: '',
    premium_amount: '',
    start_date: '',
    expiry_date: '',
    status: 'active',
  });

  useEffect(() => {
    loadPolicyData();
  }, []);

  const loadPolicyData = async () => {
    try {
      setLoading(true);
      // This would load policy data from API
      // For now, using mock data
      setPolicyData({
        policy_number: 'POL-' + policyId,
        holder_name: 'John Doe',
        holder_id_number: 'LR123456789',
        holder_phone: '+231-123-456-7890',
        holder_email: 'john.doe@email.com',
        policy_type: 'auto',
        coverage_amount: '50000',
        premium_amount: '1200',
        start_date: '2025-01-01',
        expiry_date: '2026-01-01',
        status: 'active',
      });
    } catch (error) {
      console.error('Error loading policy data:', error);
      showError('Failed to load policy data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPolicyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!policyData.policy_number || !policyData.holder_name) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      // This would call the actual API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      showSuccess('Policy updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating policy:', error);
      showError('Failed to update policy');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, required = false, keyboardType = 'default' }) => (
    <View style={styles.inputField}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={theme.colors.textSecondary}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading policy data..." />
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
            <Text style={styles.headerTitle}>Edit Policy</Text>
            <Text style={styles.headerSubtitle}>Update policy information</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputField
            label="Policy Number"
            value={policyData.policy_number}
            onChangeText={(value) => handleInputChange('policy_number', value)}
            placeholder="Enter policy number"
            required
          />

          <InputField
            label="Holder Name"
            value={policyData.holder_name}
            onChangeText={(value) => handleInputChange('holder_name', value)}
            placeholder="Enter holder name"
            required
          />

          <InputField
            label="Holder ID Number"
            value={policyData.holder_id_number}
            onChangeText={(value) => handleInputChange('holder_id_number', value)}
            placeholder="Enter ID number"
          />

          <InputField
            label="Holder Phone"
            value={policyData.holder_phone}
            onChangeText={(value) => handleInputChange('holder_phone', value)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />

          <InputField
            label="Holder Email"
            value={policyData.holder_email}
            onChangeText={(value) => handleInputChange('holder_email', value)}
            placeholder="Enter email address"
            keyboardType="email-address"
          />

          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>Policy Type</Text>
            <View style={styles.typeButtons}>
              {['auto', 'health', 'property'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    policyData.policy_type === type && styles.typeButtonActive
                  ]}
                  onPress={() => handleInputChange('policy_type', type)}
                >
                  <Text style={[
                    styles.typeButtonText,
                    policyData.policy_type === type && styles.typeButtonTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <InputField
            label="Coverage Amount"
            value={policyData.coverage_amount}
            onChangeText={(value) => handleInputChange('coverage_amount', value)}
            placeholder="Enter coverage amount"
            keyboardType="numeric"
          />

          <InputField
            label="Premium Amount"
            value={policyData.premium_amount}
            onChangeText={(value) => handleInputChange('premium_amount', value)}
            placeholder="Enter premium amount"
            keyboardType="numeric"
          />

          <InputField
            label="Start Date"
            value={policyData.start_date}
            onChangeText={(value) => handleInputChange('start_date', value)}
            placeholder="YYYY-MM-DD"
          />

          <InputField
            label="Expiry Date"
            value={policyData.expiry_date}
            onChangeText={(value) => handleInputChange('expiry_date', value)}
            placeholder="YYYY-MM-DD"
          />

          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  policyData.status === 'active' && styles.statusButtonActive
                ]}
                onPress={() => handleInputChange('status', 'active')}
              >
                <Text style={[
                  styles.statusButtonText,
                  policyData.status === 'active' && styles.statusButtonTextActive
                ]}>
                  Active
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  policyData.status === 'inactive' && styles.statusButtonActive
                ]}
                onPress={() => handleInputChange('status', 'inactive')}
              >
                <Text style={[
                  styles.statusButtonText,
                  policyData.status === 'inactive' && styles.statusButtonTextActive
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
            <Text style={styles.submitButtonText}>Update Policy</Text>
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
  typeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  typeButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  typeButtonTextActive: {
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

export default EditPolicyScreen;
