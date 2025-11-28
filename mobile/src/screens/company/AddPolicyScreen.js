import React, { useState } from 'react';
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
import { policiesAPI } from '../../services/api';

const AddPolicyScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.policy_number.trim() || !formData.holder_name.trim()) {
      showError('Please fill in policy number and holder name');
      return;
    }

    // Validate required dates
    if (!formData.start_date || !formData.expiry_date) {
      showError('Please fill in both start date and expiry date');
      return;
    }

    // Validate dates
    const startDate = new Date(formData.start_date);
    const expiryDate = new Date(formData.expiry_date);
    if (startDate >= expiryDate) {
      showError('Expiry date must be after start date');
      return;
    }

    // Validate numeric fields
    if (formData.coverage_amount && isNaN(parseFloat(formData.coverage_amount))) {
      showError('Coverage amount must be a valid number');
      return;
    }
    if (formData.premium_amount && isNaN(parseFloat(formData.premium_amount))) {
      showError('Premium amount must be a valid number');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare policy data - only include optional fields if they have valid values
      const policyData = {
        policy_number: formData.policy_number.trim(),
        holder_name: formData.holder_name.trim(),
        policy_type: formData.policy_type,
        start_date: new Date(formData.start_date).toISOString(), // Convert to ISO8601 format
        expiry_date: new Date(formData.expiry_date).toISOString(), // Convert to ISO8601 format
        company_id: user.company_id,
        status: 'active',
        is_active: true
      };

      // Add optional fields only if they have valid values
      if (formData.holder_id_number && formData.holder_id_number.trim()) {
        policyData.holder_id_number = formData.holder_id_number.trim();
      }
      
      // Phone must be at least 10 characters if provided
      if (formData.holder_phone && formData.holder_phone.trim().length >= 10) {
        policyData.holder_phone = formData.holder_phone.trim();
      }
      
      if (formData.holder_email && formData.holder_email.trim()) {
        policyData.holder_email = formData.holder_email.trim();
      }
      
      if (formData.coverage_amount) {
        policyData.coverage_amount = parseFloat(formData.coverage_amount);
      }
      
      if (formData.premium_amount) {
        policyData.premium_amount = parseFloat(formData.premium_amount);
      }

      // Call the real API
      await policiesAPI.createPolicy(policyData);
      
      showSuccess('Policy created successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating policy:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Failed to create policy. Please try again.');
      }
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
        <LoadingSpinner message="Creating policy..." />
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
            <Text style={styles.headerTitle}>Add New Policy</Text>
            <Text style={styles.headerSubtitle}>Create a new insurance policy</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputField
            label="Policy Number"
            value={formData.policy_number}
            onChangeText={(value) => handleInputChange('policy_number', value)}
            placeholder="Enter policy number"
            required
          />

          <InputField
            label="Holder Name"
            value={formData.holder_name}
            onChangeText={(value) => handleInputChange('holder_name', value)}
            placeholder="Enter holder name"
            required
          />

          <InputField
            label="Holder ID Number"
            value={formData.holder_id_number}
            onChangeText={(value) => handleInputChange('holder_id_number', value)}
            placeholder="Enter ID number"
          />

          <InputField
            label="Holder Phone"
            value={formData.holder_phone}
            onChangeText={(value) => handleInputChange('holder_phone', value)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />

          <InputField
            label="Holder Email"
            value={formData.holder_email}
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
                    formData.policy_type === type && styles.typeButtonActive
                  ]}
                  onPress={() => handleInputChange('policy_type', type)}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.policy_type === type && styles.typeButtonTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <InputField
            label="Coverage Amount"
            value={formData.coverage_amount}
            onChangeText={(value) => handleInputChange('coverage_amount', value)}
            placeholder="Enter coverage amount"
            keyboardType="numeric"
          />

          <InputField
            label="Premium Amount"
            value={formData.premium_amount}
            onChangeText={(value) => handleInputChange('premium_amount', value)}
            placeholder="Enter premium amount"
            keyboardType="numeric"
          />

          <InputField
            label="Start Date"
            value={formData.start_date}
            onChangeText={(value) => handleInputChange('start_date', value)}
            placeholder="YYYY-MM-DD (e.g., 2024-01-01)"
            keyboardType="numeric"
            required
          />

          <InputField
            label="Expiry Date"
            value={formData.expiry_date}
            onChangeText={(value) => handleInputChange('expiry_date', value)}
            placeholder="YYYY-MM-DD (e.g., 2025-01-01)"
            keyboardType="numeric"
            required
          />
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
            <Text style={styles.submitButtonText}>Create Policy</Text>
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

export default AddPolicyScreen;
