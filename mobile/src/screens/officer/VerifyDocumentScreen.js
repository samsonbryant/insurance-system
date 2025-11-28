import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { verificationAPI } from '../../services/api';
import { showMessage } from 'react-native-flash-message';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize, isTablet, isDesktop } from '../../utils/responsive';
import { useRealTime } from '../../services/realTimeService';

const VerifyDocumentScreen = ({ navigation }) => {
  const [policyNumber, setPolicyNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Real-time functionality
  const { isConnected } = useRealTime();

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      // Request camera permission
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      // Request location permission
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === 'granted');

      // Only try to get location if permission is granted and we're not on web
      if (locationStatus.status === 'granted' && Platform.OS !== 'web') {
        try {
          // Check if location services are enabled
          const isLocationEnabled = await Location.hasServicesEnabledAsync();
          if (!isLocationEnabled) {
            setLocation('Location services disabled');
            return;
          }

          // Use a more conservative approach to avoid CoreLocation errors
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest, // Use lowest accuracy to reduce errors
            timeout: 3000, // Reduce timeout to 3 seconds
            maximumAge: 300000, // Accept cached location up to 5 minutes old
            distanceInterval: 100, // Only update if moved 100 meters
          });
          setLocation(`${currentLocation.coords.latitude}, ${currentLocation.coords.longitude}`);
        } catch (locationError) {
          // Handle CoreLocation framework errors gracefully
          const errorCode = locationError.code || locationError.message;
          
          // Suppress console logging for common CoreLocation errors
          if (!errorCode.includes('kCLErrorLocationUnknown') && !errorCode.includes('E_LOCATION_UNKNOWN')) {
            console.log('Location access failed:', locationError.message);
          }
          
          // Handle specific error types
          if (errorCode.includes('kCLErrorLocationUnknown') || errorCode === 'E_LOCATION_UNKNOWN') {
            setLocation('Location unknown - using manual entry');
          } else if (errorCode.includes('kCLErrorDenied') || errorCode === 'E_LOCATION_SERVICES_DISABLED') {
            setLocation('Location services disabled');
          } else if (errorCode.includes('kCLErrorLocation') || errorCode === 'E_LOCATION_UNAVAILABLE') {
            setLocation('Location unavailable');
          } else {
            setLocation('Location not available');
          }
        }
      } else if (Platform.OS === 'web') {
        // For web, set a default location
        setLocation('Web - Location not available');
      } else {
        // Permission not granted
        setLocation('Location permission required');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const handleScanQR = () => {
    if (!hasCameraPermission) {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to scan QR codes',
        [{ text: 'OK' }]
      );
      return;
    }
    // Navigate to QR scanner screen
    navigation.navigate('QRScanner', { onScan: handleQRScan });
  };

  const handleQRScan = (data) => {
    try {
      const parsedData = JSON.parse(data);
      setPolicyNumber(parsedData.policy_number || '');
      setHolderName(parsedData.holder_name || '');
      setExpiryDate(parsedData.expiry_date || '');
    } catch (error) {
      showMessage({
        message: 'Invalid QR code format',
        type: 'warning',
      });
    }
  };

  const handleVerify = async () => {
    if (!policyNumber.trim() || !holderName.trim()) {
      showMessage({
        message: 'Please fill in policy number and holder name',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    setVerificationResult(null);

    try {
      const verificationData = {
        policy_number: policyNumber.trim(),
        holder_name: holderName.trim(),
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        verification_method: 'manual',
        location: location && location.trim() ? location.trim() : undefined,
        additional_notes: ''
      };

      const response = await verificationAPI.verifyDocument(verificationData);
      setVerificationResult(response);

      // Show appropriate message based on result
      const statusMessages = {
        valid: 'Document verified successfully!',
        fake: '⚠️ FAKE DOCUMENT DETECTED!',
        expired: 'Document has expired',
        not_found: 'Policy not found in database',
        pending: 'Verification pending review'
      };

      showMessage({
        message: statusMessages[response.verification.status] || 'Verification completed',
        type: response.verification.status === 'valid' ? 'success' : 
              response.verification.status === 'fake' ? 'danger' : 'warning',
      });

    } catch (error) {
      console.error('Verification error:', error);
      showMessage({
        message: 'Verification failed. Please try again.',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setPolicyNumber('');
    setHolderName('');
    setExpiryDate('');
    setVerificationResult(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return '#28a745';
      case 'fake': return '#dc3545';
      case 'expired': return '#ffc107';
      case 'not_found': return '#6c757d';
      case 'pending': return '#007AFF';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid': return 'checkmark-circle';
      case 'fake': return 'warning';
      case 'expired': return 'time';
      case 'not_found': return 'search';
      case 'pending': return 'hourglass';
      default: return 'help-circle';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Document Verification</Text>
            <Text style={styles.subtitle}>Verify insurance documents</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle" size={responsiveFontSize(32)} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Input Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Document Details</Text>
          
          {/* Policy Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Policy Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter policy number"
              value={policyNumber}
              onChangeText={setPolicyNumber}
              autoCapitalize="characters"
              returnKeyType="next"
            />
          </View>

          {/* Holder Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Holder Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter holder name"
              value={holderName}
              onChangeText={setHolderName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Expiry Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Expiry Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={expiryDate}
              onChangeText={setExpiryDate}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>

          {/* Location */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Current location"
              value={location}
              onChangeText={setLocation}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScanQR}
            disabled={!hasCameraPermission}
          >
            <Ionicons name="qr-code" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>Scan QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify Document'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearForm}
          >
            <Ionicons name="refresh" size={20} color="#666" />
            <Text style={styles.clearButtonText}>Clear Form</Text>
          </TouchableOpacity>
        </View>

        {/* Verification Result */}
        {verificationResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Verification Result</Text>
            
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.resultStatus}>
                  <Ionicons 
                    name={getStatusIcon(verificationResult.verification.status)} 
                    size={32} 
                    color={getStatusColor(verificationResult.verification.status)} 
                  />
                  <Text style={[
                    styles.resultStatusText,
                    { color: getStatusColor(verificationResult.verification.status) }
                  ]}>
                    {verificationResult.verification.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.confidenceScore}>
                  {verificationResult.verification.confidence_score}% confidence
                </Text>
              </View>

              <Text style={styles.resultReason}>
                {verificationResult.verification.reason}
              </Text>

              {verificationResult.matched_policy && (
                <View style={styles.matchedPolicyContainer}>
                  <Text style={styles.matchedPolicyTitle}>Matched Policy:</Text>
                  <Text style={styles.matchedPolicyText}>
                    Policy: {verificationResult.matched_policy.policy_number}
                  </Text>
                  <Text style={styles.matchedPolicyText}>
                    Holder: {verificationResult.matched_policy.holder_name}
                  </Text>
                  <Text style={styles.matchedPolicyText}>
                    Expiry: {verificationResult.matched_policy.expiry_date}
                  </Text>
                  <Text style={styles.matchedPolicyText}>
                    Company: {verificationResult.matched_policy.company?.name}
                  </Text>
                </View>
              )}

              <View style={styles.resultFooter}>
                <Text style={styles.resultTime}>
                  Verified at: {new Date(verificationResult.verification.verified_at).toLocaleString()}
                </Text>
                <Text style={styles.responseTime}>
                  Response time: {verificationResult.verification.response_time_ms}ms
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Permission Status */}
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Permissions</Text>
          <View style={styles.permissionItem}>
            <Ionicons 
              name={hasCameraPermission ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={hasCameraPermission ? "#28a745" : "#dc3545"} 
            />
            <Text style={styles.permissionText}>Camera Access</Text>
          </View>
          <View style={styles.permissionItem}>
            <Ionicons 
              name={hasLocationPermission ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={hasLocationPermission ? "#28a745" : "#dc3545"} 
            />
            <Text style={styles.permissionText}>Location Access</Text>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  headerLeft: {
    flex: 1,
  },
  profileButton: {
    padding: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  formTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    ...theme.typography.bodySmall,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    ...commonStyles.input,
    minHeight: responsiveHeight(48),
    fontSize: responsiveFontSize(16),
  },
  actionContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  scanButton: {
    ...commonStyles.button,
    backgroundColor: theme.colors.secondary,
    marginBottom: theme.spacing.md,
    minHeight: responsiveHeight(50),
  },
  scanButtonText: {
    ...commonStyles.buttonText,
    marginLeft: theme.spacing.sm,
  },
  verifyButton: {
    ...commonStyles.button,
    ...commonStyles.buttonPrimary,
    marginBottom: theme.spacing.md,
    minHeight: responsiveHeight(50),
  },
  verifyButtonDisabled: {
    backgroundColor: theme.colors.textLight,
  },
  verifyButtonText: {
    ...commonStyles.buttonText,
    marginLeft: theme.spacing.sm,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  clearButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  resultContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  resultTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  resultStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultStatusText: {
    ...theme.typography.h4,
    marginLeft: theme.spacing.sm,
  },
  confidenceScore: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  resultReason: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  matchedPolicyContainer: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  matchedPolicyTitle: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  matchedPolicyText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  resultFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  resultTime: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  responseTime: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  permissionContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  permissionTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  permissionText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
});

export default VerifyDocumentScreen;
