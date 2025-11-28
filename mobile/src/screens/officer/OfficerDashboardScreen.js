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
import { reportsAPI } from '../../services/api';
import LoadingSpinner, { LoadingCard } from '../../components/LoadingSpinner';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize, getCardWidth } from '../../utils/responsive';
import { useRealTime, useRealTimeEvents } from '../../services/realTimeService';

const OfficerDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Real-time functionality
  const { isConnected, connectionError } = useRealTime(user?.accessToken);
  const realTimeData = useRealTimeEvents(['verificationUpdate', 'newVerification', 'systemAlert']);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Update dashboard when real-time data changes
  useEffect(() => {
    if (realTimeData.verificationUpdate || realTimeData.newVerification) {
      loadDashboardData();
    }
  }, [realTimeData]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real dashboard data from API
      const response = await reportsAPI.getDashboard();
      const dashboardStats = response.dashboardStats;
      
      // Transform API data to match our UI structure
      const dashboardData = {
        totalVerifications: dashboardStats.overview.total_verifications,
        todayVerifications: dashboardStats.overview.recent_verifications_24h,
        validVerifications: dashboardStats.verification_breakdown.valid || 0,
        fakeVerifications: dashboardStats.verification_breakdown.fake || 0,
        expiredVerifications: dashboardStats.verification_breakdown.expired || 0,
        averageResponseTime: 1.2, // This would need to be calculated from verification data
        lastVerification: new Date().toISOString(),
        verificationBreakdown: dashboardStats.verification_breakdown
      };
      
      setDashboardData(dashboardData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    showSuccess('Dashboard refreshed');
  };

  const StatCard = ({ title, value, icon, color, onPress, subtitle }) => (
    <TouchableOpacity 
      style={[
        styles.statCard, 
        { 
          borderLeftColor: color,
          width: getCardWidth(theme.spacing.lg),
        }
      ]} 
      onPress={onPress}
    >
      <View style={styles.statCardContent}>
        <View style={styles.statCardLeft}>
          <Text style={styles.statCardTitle}>{title}</Text>
          <Text style={styles.statCardValue}>{value}</Text>
          {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.statCardIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={responsiveFontSize(24)} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, description, icon, color, onPress }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={responsiveFontSize(24)} color={color} />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={responsiveFontSize(20)} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Officer Dashboard</Text>
        </View>
        <LoadingCard text="Loading dashboard data..." />
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
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.first_name || user?.username}</Text>
            <View style={styles.connectionStatus}>
              <Ionicons 
                name={isConnected ? "wifi" : "wifi-outline"} 
                size={responsiveFontSize(16)} 
                color={isConnected ? theme.colors.success : theme.colors.danger} 
              />
              <Text style={[
                styles.connectionText,
                { color: isConnected ? theme.colors.success : theme.colors.danger }
              ]}>
                {isConnected ? 'Live' : 'Offline'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={async () => {
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
                          console.log('OfficerDashboardScreen: Starting logout process...');
                          const result = await logout();
                          console.log('OfficerDashboardScreen: Logout result:', result);
                          if (result.success) {
                            showSuccess('Logged out successfully');
                            console.log('OfficerDashboardScreen: Logout successful, should redirect to login');
                            // Force navigation reset to ensure proper redirect
                            setTimeout(() => {
                              navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                              });
                            }, 1000);
                          } else {
                            showError('Failed to logout. Please try again.');
                            console.log('OfficerDashboardScreen: Logout failed:', result.error);
                          }
                        } catch (error) {
                          console.error('OfficerDashboardScreen: Logout error:', error);
                          showError('Failed to logout. Please try again.');
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="log-out-outline" size={responsiveFontSize(20)} color={theme.colors.danger} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-circle" size={responsiveFontSize(40)} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Verification Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Verifications"
              value={dashboardData?.totalVerifications?.toLocaleString() || '0'}
              icon="shield-checkmark"
              color={theme.colors.primary}
              onPress={() => navigation.navigate('VerificationHistory')}
            />
            <StatCard
              title="Today's Verifications"
              value={dashboardData?.todayVerifications?.toLocaleString() || '0'}
              icon="today"
              color={theme.colors.success}
              subtitle="Completed today"
            />
            <StatCard
              title="Valid Documents"
              value={dashboardData?.validVerifications?.toLocaleString() || '0'}
              icon="checkmark-circle"
              color={theme.colors.success}
              subtitle={`${Math.round((dashboardData?.validVerifications / dashboardData?.totalVerifications) * 100)}% valid`}
            />
            <StatCard
              title="Fake Documents"
              value={dashboardData?.fakeVerifications?.toLocaleString() || '0'}
              icon="warning"
              color={theme.colors.danger}
              subtitle="Detected fakes"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              title="Verify Document"
              description="Scan and verify insurance documents"
              icon="scan"
              color={theme.colors.primary}
              onPress={() => navigation.navigate('VerifyDocument')}
            />
            <QuickActionCard
              title="Verification History"
              description="View past verification records"
              icon="time"
              color={theme.colors.info}
              onPress={() => navigation.navigate('VerificationHistory')}
            />
            <QuickActionCard
              title="Reports"
              description="View verification reports and analytics"
              icon="bar-chart"
              color={theme.colors.secondary}
              onPress={() => navigation.navigate('OfficerReports')}
            />
            <QuickActionCard
              title="Profile Settings"
              description="Manage your profile and account"
              icon="person"
              color={theme.colors.success}
              onPress={() => navigation.navigate('Profile')}
            />
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsCard}>
            <View style={styles.metricItem}>
              <Ionicons name="speedometer" size={responsiveFontSize(24)} color={theme.colors.info} />
              <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>Average Response Time</Text>
                <Text style={styles.metricValue}>{dashboardData?.averageResponseTime}s</Text>
              </View>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="trending-up" size={responsiveFontSize(24)} color={theme.colors.success} />
              <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>Success Rate</Text>
                <Text style={styles.metricValue}>
                  {Math.round((dashboardData?.validVerifications / dashboardData?.totalVerifications) * 100)}%
                </Text>
              </View>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="time" size={responsiveFontSize(24)} color={theme.colors.warning} />
              <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>Last Verification</Text>
                <Text style={styles.metricValue}>
                  {new Date(dashboardData?.lastVerification).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <Ionicons name="shield-checkmark" size={responsiveFontSize(20)} color={theme.colors.success} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Document Verified</Text>
                <Text style={styles.activityDescription}>Policy #POL-2023-001 verified as VALID</Text>
                <Text style={styles.activityTime}>2 minutes ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="warning" size={responsiveFontSize(20)} color={theme.colors.danger} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Fake Document Detected</Text>
                <Text style={styles.activityDescription}>Policy #POL-2023-002 flagged as FAKE</Text>
                <Text style={styles.activityTime}>15 minutes ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="time" size={responsiveFontSize(20)} color={theme.colors.warning} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Expired Policy</Text>
                <Text style={styles.activityDescription}>Policy #POL-2023-003 has expired</Text>
                <Text style={styles.activityTime}>1 hour ago</Text>
              </View>
            </View>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  profileButton: {
    padding: theme.spacing.sm,
  },
  greeting: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  userName: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionText: {
    ...theme.typography.bodySmall,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  statsContainer: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    ...theme.shadows.md,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCardLeft: {
    flex: 1,
  },
  statCardTitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  statCardValue: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  statCardSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  statCardIcon: {
    width: responsiveWidth(50),
    height: responsiveHeight(50),
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  quickActionsGrid: {
    gap: theme.spacing.md,
  },
  quickActionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  quickActionIcon: {
    width: responsiveWidth(50),
    height: responsiveHeight(50),
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  quickActionDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  metricsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  metricsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  metricContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  metricTitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  metricValue: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  activityContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activityContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  activityTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  activityDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  activityTime: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
});

export default OfficerDashboardScreen;
