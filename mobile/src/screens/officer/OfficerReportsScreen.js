import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../components/NotificationProvider';
import LoadingSpinner from '../../components/LoadingSpinner';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../../utils/responsive';
import { reportsAPI } from '../../services/api';

const OfficerReportsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Load dashboard statistics
      const dashboardResponse = await reportsAPI.getDashboard();
      setDashboardStats(dashboardResponse.dashboardStats);
      
      // Load verification reports for this officer
      const verificationResponse = await reportsAPI.getVerificationReports({
        officer_id: user.id
      });
      const verificationReport = {
        id: 'verifications',
        title: 'My Verification Reports',
        type: 'verification',
        description: 'Your verification statistics and performance',
        data: verificationResponse.report,
        icon: 'checkmark-circle',
        color: theme.colors.success,
      };

      setReports([verificationReport]);
    } catch (error) {
      console.error('Error loading reports:', error);
      showError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleExportReport = (report) => {
    Alert.alert(
      'Export Report',
      `Export ${report.title} as CSV?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => exportReport(report)
        }
      ]
    );
  };

  const exportReport = async (report) => {
    try {
      if (report.type === 'verification') {
        await reportsAPI.getVerificationReports({ 
          format: 'csv',
          officer_id: user.id
        });
      } else {
        showError('Export not available for this report type');
        return;
      }
      
      showSuccess('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      showError('Failed to export report');
    }
  };

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={responsiveFontSize(24)} color={theme.colors.white} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const ReportCard = ({ report }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={[styles.reportIcon, { backgroundColor: report.color }]}>
          <Ionicons name={report.icon} size={responsiveFontSize(24)} color={theme.colors.white} />
        </View>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportDescription}>{report.description}</Text>
        </View>
      </View>

      {report.data && (
        <View style={styles.reportStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{report.data.statistics?.total_verifications || 0}</Text>
            <Text style={styles.statLabel}>Total Verifications</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{report.data.statistics?.valid_count || 0}</Text>
            <Text style={styles.statLabel}>Valid</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{report.data.statistics?.fake_count || 0}</Text>
            <Text style={styles.statLabel}>Fake</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{report.data.statistics?.fake_detection_rate || 0}%</Text>
            <Text style={styles.statLabel}>Fake Rate</Text>
          </View>
        </View>
      )}

      <View style={styles.reportActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => navigation.navigate('VerificationHistory')}
        >
          <Ionicons name="eye-outline" size={responsiveFontSize(16)} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>View History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.exportButton]}
          onPress={() => handleExportReport(report)}
        >
          <Ionicons name="download-outline" size={responsiveFontSize(16)} color={theme.colors.success} />
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading reports..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>My Reports</Text>
            <Text style={styles.headerSubtitle}>
              Your verification performance and statistics
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={responsiveFontSize(24)} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        {dashboardStats && (
          <View style={styles.quickStatsContainer}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <View style={styles.quickStatsGrid}>
              <StatCard
                title="Total Verifications"
                value={dashboardStats.overview?.total_verifications || 0}
                icon="checkmark-circle"
                color={theme.colors.success}
                onPress={() => navigation.navigate('VerificationHistory')}
              />
              
              <StatCard
                title="Today's Verifications"
                value={dashboardStats.overview?.recent_verifications_24h || 0}
                icon="time"
                color={theme.colors.primary}
                onPress={() => navigation.navigate('VerificationHistory')}
              />
              
              <StatCard
                title="Valid Verifications"
                value={dashboardStats.verification_breakdown?.valid || 0}
                icon="checkmark"
                color={theme.colors.success}
                onPress={() => navigation.navigate('VerificationHistory')}
              />
              
              <StatCard
                title="Fake Detections"
                value={dashboardStats.verification_breakdown?.fake || 0}
                icon="warning"
                color={theme.colors.danger}
                onPress={() => navigation.navigate('VerificationHistory')}
              />
            </View>
          </View>
        )}

        {/* Reports List */}
        <View style={styles.reportsContainer}>
          <Text style={styles.sectionTitle}>
            Detailed Reports ({reports.length})
          </Text>
          
          {reports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={responsiveFontSize(64)} color={theme.colors.textMuted} />
              <Text style={styles.emptyTitle}>No reports available</Text>
              <Text style={styles.emptySubtitle}>
                Reports will appear here once you start verifying policies
              </Text>
            </View>
          ) : (
            reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))
          )}
        </View>

        {/* Performance Metrics */}
        {dashboardStats?.verification_breakdown && (
          <View style={styles.metricsContainer}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            <View style={styles.metricsGrid}>
              {Object.entries(dashboardStats.verification_breakdown).map(([status, count]) => (
                <View key={status} style={styles.metricItem}>
                  <Text style={styles.metricValue}>{count}</Text>
                  <Text style={styles.metricLabel}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('VerifyDocument')}
            >
              <Ionicons name="camera-outline" size={responsiveFontSize(32)} color={theme.colors.primary} />
              <Text style={styles.quickActionText}>Verify Document</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('VerificationHistory')}
            >
              <Ionicons name="list-outline" size={responsiveFontSize(32)} color={theme.colors.success} />
              <Text style={styles.quickActionText}>View History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleExportReport(reports[0])}
            >
              <Ionicons name="download-outline" size={responsiveFontSize(32)} color={theme.colors.warning} />
              <Text style={styles.quickActionText}>Export Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-outline" size={responsiveFontSize(32)} color={theme.colors.info} />
              <Text style={styles.quickActionText}>My Profile</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  refreshButton: {
    backgroundColor: theme.colors.surface,
    width: responsiveHeight(48),
    height: responsiveHeight(48),
    borderRadius: responsiveHeight(24),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  quickStatsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  quickStatsGrid: {
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
  reportsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  reportCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  reportIcon: {
    width: responsiveHeight(48),
    height: responsiveHeight(48),
    borderRadius: responsiveHeight(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  reportDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  viewButton: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  exportButton: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success + '10',
  },
  actionButtonText: {
    ...theme.typography.caption,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.h4,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  metricsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '30%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  metricValue: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  metricLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  quickActionText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '500',
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default OfficerReportsScreen;
