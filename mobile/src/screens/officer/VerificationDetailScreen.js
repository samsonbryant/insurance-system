import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../components/NotificationProvider';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../../utils/responsive';

const VerificationDetailScreen = ({ navigation, route }) => {
  const { verification } = route.params;
  const { showSuccess, showError } = useNotifications();

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
        return theme.colors.success;
      case 'fake':
        return theme.colors.danger;
      case 'expired':
        return theme.colors.warning;
      case 'not_found':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
        return 'checkmark-circle';
      case 'fake':
        return 'close-circle';
      case 'expired':
        return 'time';
      case 'not_found':
        return 'help-circle';
      default:
        return 'information-circle';
    }
  };

  const DetailItem = ({ label, value, icon, color = theme.colors.text }) => (
    <View style={styles.detailItem}>
      <View style={styles.detailHeader}>
        <Ionicons name={icon} size={responsiveFontSize(20)} color={color} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, { color }]}>{value || 'N/A'}</Text>
    </View>
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
            <Ionicons name="arrow-back" size={responsiveFontSize(24)} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Verification Details</Text>
            <Text style={styles.headerSubtitle}>Policy verification information</Text>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={getStatusIcon(verification.status)} 
              size={responsiveFontSize(40)} 
              color={getStatusColor(verification.status)} 
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {verification.status.charAt(0).toUpperCase() + verification.status.slice(1).replace('_', ' ')}
              </Text>
              <Text style={styles.statusSubtitle}>
                Verification #{verification.id}
              </Text>
            </View>
          </View>
          {verification.reason && (
            <Text style={styles.reasonText}>{verification.reason}</Text>
          )}
        </View>

        {/* Policy Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Policy Information</Text>
          <DetailItem
            label="Policy Number"
            value={verification.policy_number}
            icon="document-text"
          />
          <DetailItem
            label="Holder Name"
            value={verification.holder_name}
            icon="person"
          />
          <DetailItem
            label="Expiry Date"
            value={verification.expiry_date ? new Date(verification.expiry_date).toLocaleDateString() : 'N/A'}
            icon="calendar"
          />
        </View>

        {/* Verification Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Details</Text>
          <DetailItem
            label="Verification Method"
            value={verification.verification_method || 'Manual'}
            icon="scan"
          />
          <DetailItem
            label="Location"
            value={verification.location}
            icon="location"
          />
          <DetailItem
            label="Confidence Score"
            value={verification.confidence_score ? `${verification.confidence_score}%` : 'N/A'}
            icon="trending-up"
          />
          <DetailItem
            label="Response Time"
            value={verification.response_time_ms ? `${verification.response_time_ms}ms` : 'N/A'}
            icon="time"
          />
        </View>

        {/* Officer Information */}
        {verification.officer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Officer Information</Text>
            <DetailItem
              label="Officer Name"
              value={`${verification.officer.first_name} ${verification.officer.last_name}`}
              icon="person-circle"
            />
            <DetailItem
              label="Username"
              value={verification.officer.username}
              icon="at"
            />
          </View>
        )}

        {/* Company Information */}
        {verification.company && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Information</Text>
            <DetailItem
              label="Company Name"
              value={verification.company.name}
              icon="business"
            />
            <DetailItem
              label="License Number"
              value={verification.company.license_number}
              icon="card"
            />
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timestamps</Text>
          <DetailItem
            label="Verified At"
            value={verification.verified_at ? new Date(verification.verified_at).toLocaleString() : 'N/A'}
            icon="time"
          />
          <DetailItem
            label="Created At"
            value={verification.createdAt ? new Date(verification.createdAt).toLocaleString() : 'N/A'}
            icon="calendar"
          />
        </View>

        {/* Additional Notes */}
        {verification.additional_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{verification.additional_notes}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={responsiveFontSize(20)} color={theme.colors.textSecondary} />
            <Text style={styles.actionButtonText}>Back to History</Text>
          </TouchableOpacity>
          
          {verification.document_image && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => {
                // TODO: Implement image viewer
                showSuccess('Image viewer coming soon');
              }}
            >
              <Ionicons name="eye" size={responsiveFontSize(20)} color={theme.colors.white} />
              <Text style={[styles.actionButtonText, styles.primaryButtonText]}>View Document</Text>
            </TouchableOpacity>
          )}
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
  statusCard: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  statusTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statusSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  reasonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  section: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  detailItem: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    fontWeight: '500',
  },
  detailValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginLeft: theme.spacing.lg,
  },
  notesContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  notesText: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  primaryButtonText: {
    color: theme.colors.white,
  },
});

export default VerificationDetailScreen;
