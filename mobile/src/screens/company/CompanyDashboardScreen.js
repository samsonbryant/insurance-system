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

const CompanyDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Real-time functionality
  const { isConnected, connectionError } = useRealTime(user?.accessToken);
  const realTimeData = useRealTimeEvents(['policyUpdate', 'verificationRequest', 'companyStatusUpdate']);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Update dashboard when real-time data changes
  useEffect(() => {
    if (realTimeData.policyUpdate || realTimeData.verificationRequest) {
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
        totalPolicies: dashboardStats.overview.total_policies,
        activePolicies: dashboardStats.policy_breakdown.active || 0,
        expiredPolicies: dashboardStats.policy_breakdown.expired || 0,
        totalVerifications: dashboardStats.overview.total_verifications,
        pendingVerifications: dashboardStats.verification_breakdown.pending || 0,
        verifiedToday: dashboardStats.overview.recent_verifications_24h,
        companyStatus: 'active', // This could be fetched from company profile
        lastSync: new Date().toISOString(),
        verificationBreakdown: dashboardStats.verification_breakdown,
        policyBreakdown: dashboardStats.policy_breakdown
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
          <Text style={styles.title}>Company Dashboard</Text>
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
          <Text style={styles.sectionTitle}>Policy Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Policies"
              value={dashboardData?.totalPolicies?.toLocaleString() || '0'}
              icon="document-text"
              color={theme.colors.primary}
              onPress={() => navigation.navigate('CompanyPolicies')}
            />
            <StatCard
              title="Active Policies"
              value={dashboardData?.activePolicies?.toLocaleString() || '0'}
              icon="checkmark-circle"
              color={theme.colors.success}
              subtitle={`${Math.round((dashboardData?.activePolicies / dashboardData?.totalPolicies) * 100)}% active`}
            />
            <StatCard
              title="Expired Policies"
              value={dashboardData?.expiredPolicies?.toLocaleString() || '0'}
              icon="time"
              color={theme.colors.warning}
              subtitle="Requires attention"
            />
            <StatCard
              title="Verifications Today"
              value={dashboardData?.verifiedToday?.toLocaleString() || '0'}
              icon="shield-checkmark"
              color={theme.colors.info}
              subtitle="Policy verifications"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              title="Manage Policies"
              description="View and manage insurance policies"
              icon="document-text"
              color={theme.colors.primary}
              onPress={() => navigation.navigate('CompanyPolicies')}
            />
            <QuickActionCard
              title="View Reports"
              description="Analytics and performance reports"
              icon="bar-chart"
              color={theme.colors.info}
              onPress={() => navigation.navigate('CompanyReports')}
            />
            <QuickActionCard
              title="Company Settings"
              description="Configure company settings"
              icon="settings"
              color={theme.colors.secondary}
              onPress={() => navigation.navigate('CompanySettings')}
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

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <Ionicons name="shield-checkmark" size={responsiveFontSize(20)} color={theme.colors.success} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Policy Verified</Text>
                <Text style={styles.activityDescription}>Policy #POL-2023-001 verified successfully</Text>
                <Text style={styles.activityTime}>2 minutes ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="document-text" size={responsiveFontSize(20)} color={theme.colors.primary} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>New Policy Added</Text>
                <Text style={styles.activityDescription}>Policy #POL-2023-002 added to system</Text>
                <Text style={styles.activityTime}>15 minutes ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="warning" size={responsiveFontSize(20)} color={theme.colors.warning} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Policy Expiring Soon</Text>
                <Text style={styles.activityDescription}>Policy #POL-2023-003 expires in 7 days</Text>
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

export default CompanyDashboardScreen;
