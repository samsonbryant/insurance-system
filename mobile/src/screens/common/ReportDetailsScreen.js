import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../components/NotificationProvider';
import LoadingSpinner from '../../components/LoadingSpinner';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../../utils/responsive';

const ReportDetailsScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const { report } = route.params;
  const [loading, setLoading] = useState(false);

  const handleExportReport = () => {
    Alert.alert(
      'Export Report',
      'This feature will be implemented in the next update.',
      [{ text: 'OK' }]
    );
  };

  const StatCard = ({ title, value, icon, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={responsiveFontSize(24)} color={theme.colors.white} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{title}</Text>
      </View>
    </View>
  );

  const DataRow = ({ label, value }) => (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
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
            <Text style={styles.headerTitle}>{report.title}</Text>
            <Text style={styles.headerSubtitle}>{report.description}</Text>
          </View>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleExportReport}
          >
            <Ionicons name="download-outline" size={responsiveFontSize(24)} color={theme.colors.success} />
          </TouchableOpacity>
        </View>

        {/* Report Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Information</Text>
          
          <DataRow
            label="Generated At"
            value={report.data?.generated_at ? new Date(report.data.generated_at).toLocaleString() : 'N/A'}
          />
          
          <DataRow
            label="Report Type"
            value={report.type?.charAt(0).toUpperCase() + report.type?.slice(1)}
          />
          
          {report.data?.filters && Object.keys(report.data.filters).length > 0 && (
            <DataRow
              label="Filters Applied"
              value={Object.keys(report.data.filters).length + ' filters'}
            />
          )}
        </View>

        {/* Statistics */}
        {report.data?.statistics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            
            <View style={styles.statsGrid}>
              {Object.entries(report.data.statistics).map(([key, value]) => {
                // Handle different value types
                let displayValue = value;
                if (typeof value === 'object' && value !== null) {
                  if (Array.isArray(value)) {
                    displayValue = value.length;
                  } else {
                    displayValue = Object.keys(value).length;
                  }
                }
                
                return (
                  <StatCard
                    key={key}
                    title={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    value={displayValue}
                    icon="bar-chart"
                    color={theme.colors.primary}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Data Summary */}
        {report.data && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Summary</Text>
            
            {report.type === 'verification' && report.data.verifications && (
              <View style={styles.dataSummary}>
                <Text style={styles.summaryTitle}>Verifications ({report.data.verifications.length})</Text>
                {report.data.verifications.slice(0, 5).map((verification, index) => (
                  <View key={index} style={styles.dataItem}>
                    <Text style={styles.dataItemText}>
                      {verification.policy_number} - {verification.status}
                    </Text>
                  </View>
                ))}
                {report.data.verifications.length > 5 && (
                  <Text style={styles.moreText}>
                    ... and {report.data.verifications.length - 5} more
                  </Text>
                )}
              </View>
            )}

            {report.type === 'policy' && report.data.policies && (
              <View style={styles.dataSummary}>
                <Text style={styles.summaryTitle}>Policies ({report.data.policies.length})</Text>
                {report.data.policies.slice(0, 5).map((policy, index) => (
                  <View key={index} style={styles.dataItem}>
                    <Text style={styles.dataItemText}>
                      {policy.policy_number} - {policy.policy_type}
                    </Text>
                  </View>
                ))}
                {report.data.policies.length > 5 && (
                  <Text style={styles.moreText}>
                    ... and {report.data.policies.length - 5} more
                  </Text>
                )}
              </View>
            )}

            {report.type === 'audit' && report.data.audit_logs && (
              <View style={styles.dataSummary}>
                <Text style={styles.summaryTitle}>Audit Logs ({report.data.audit_logs.length})</Text>
                {report.data.audit_logs.slice(0, 5).map((log, index) => (
                  <View key={index} style={styles.dataItem}>
                    <Text style={styles.dataItemText}>
                      {log.action} - {log.user?.username}
                    </Text>
                  </View>
                ))}
                {report.data.audit_logs.length > 5 && (
                  <Text style={styles.moreText}>
                    ... and {report.data.audit_logs.length - 5} more
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleExportReport}
          >
            <Ionicons name="download-outline" size={responsiveFontSize(20)} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>Export Report</Text>
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
  exportButton: {
    padding: theme.spacing.sm,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dataLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  dataValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  statIcon: {
    width: responsiveHeight(48),
    height: responsiveHeight(48),
    borderRadius: responsiveHeight(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  dataSummary: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  summaryTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  dataItem: {
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dataItemText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  moreText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
  actions: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  actionButtonText: {
    ...theme.typography.body,
    color: theme.colors.white,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
});

export default ReportDetailsScreen;
