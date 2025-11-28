import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { insurerAPI } from '../../services/api';
import { showMessage } from 'react-native-flash-message';
import { useNotifications } from '../../components/NotificationProvider';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize, isTablet, isDesktop, getCardWidth, getGridColumns } from '../../utils/responsive';
import { useRealTime, useRealTimeEvents } from '../../services/realTimeService';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');

const InsurerDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  // Real-time connection
  const { isConnected, connectionStatus } = useRealTime();
  useRealTimeEvents({
    'policy-approved': (data) => {
      showSuccess(`Policy ${data.policyNumber} approved by CBL`);
      loadDashboardData();
    },
    'policy-declined': (data) => {
      showError(`Policy ${data.policyNumber} declined: ${data.reason}`);
      loadDashboardData();
    },
    'claim-reported': (data) => {
      showSuccess(`New claim reported: ${data.claimId}`);
      loadDashboardData();
    },
    'bond-created': (data) => {
      showSuccess(`Bond created: ${data.bondId}`);
      loadDashboardData();
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await insurerAPI.getDashboard();
      setDashboardData(response.dashboard);
    } catch (error) {
      console.error('Error loading insurer dashboard data:', error);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

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
              console.log('InsurerDashboardScreen: Starting logout process...');
              const result = await logout();
              console.log('InsurerDashboardScreen: Logout result:', result);
              if (result.success) {
                showSuccess('Logged out successfully');
                console.log('InsurerDashboardScreen: Logout successful, should redirect to login');
                setTimeout(() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                }, 1000);
              } else {
                showError('Failed to logout. Please try again.');
                console.log('InsurerDashboardScreen: Logout failed:', result.error);
              }
            } catch (error) {
              console.error('InsurerDashboardScreen: Logout error:', error);
              showError('Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const StatCard = ({ title, value, icon, color, onPress, subtitle, trend }) => (
    <TouchableOpacity 
      style={[styles.statCard, { width: getCardWidth() }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statCardContent}>
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={responsiveFontSize(24)} color={color} />
          </View>
          {trend && (
            <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? theme.colors.success + '20' : theme.colors.danger + '20' }]}>
              <Ionicons 
                name={trend > 0 ? 'trending-up' : 'trending-down'} 
                size={responsiveFontSize(12)} 
                color={trend > 0 ? theme.colors.success : theme.colors.danger} 
              />
              <Text style={[styles.trendText, { color: trend > 0 ? theme.colors.success : theme.colors.danger }]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, description, icon, color, onPress, badge }) => (
    <TouchableOpacity 
      style={[styles.actionCard, { width: getCardWidth() }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.actionCardContent}>
        <View style={styles.actionHeader}>
          <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={responsiveFontSize(28)} color={color} />
          </View>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionDescription}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={responsiveFontSize(20)} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading Insurer Dashboard..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Insurer Dashboard</Text>
            <Text style={styles.headerSubtitle}>{user?.company?.name || 'Insurance Company'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionDot, 
              { backgroundColor: isConnected ? theme.colors.success : theme.colors.danger }
            ]} />
            <Text style={styles.connectionText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome, {user?.first_name || 'Insurer'}</Text>
          <Text style={styles.welcomeSubtitle}>
            Manage policies, claims, and bonds for {user?.company?.name || 'your company'}
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Policies"
              value={dashboardData?.policies?.total || 0}
              icon="document-text-outline"
              color={theme.colors.primary}
              subtitle={`${dashboardData?.policies?.approved || 0} approved`}
              trend={dashboardData?.policies?.trend || 0}
              onPress={() => navigation.navigate('InsurerPolicies')}
            />
            <StatCard
              title="Claims"
              value={dashboardData?.claims?.total || 0}
              icon="warning-outline"
              color={theme.colors.warning}
              subtitle={`${dashboardData?.claims?.reported || 0} reported`}
              trend={dashboardData?.claims?.trend || 0}
              onPress={() => navigation.navigate('InsurerClaims')}
            />
            <StatCard
              title="Bonds"
              value={dashboardData?.bonds?.total || 0}
              icon="shield-outline"
              color={theme.colors.success}
              subtitle={`${dashboardData?.bonds?.active || 0} active`}
              trend={dashboardData?.bonds?.trend || 0}
              onPress={() => navigation.navigate('InsurerBonds')}
            />
            <StatCard
              title="Revenue"
              value={`$${dashboardData?.revenue?.total || 0}`}
              icon="cash-outline"
              color={theme.colors.info}
              subtitle={`$${dashboardData?.revenue?.monthly || 0} this month`}
              trend={dashboardData?.revenue?.trend || 0}
              onPress={() => navigation.navigate('InsurerReports')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickActionCard
              title="Create Policy"
              description="Generate new insurance policy"
              icon="add-circle"
              color={theme.colors.primary}
              badge={dashboardData?.policies?.pending ? `${dashboardData.policies.pending} pending` : null}
              onPress={() => navigation.navigate('InsurerCreatePolicy')}
            />
            <QuickActionCard
              title="Manage Claims"
              description="Review and process claims"
              icon="document-text"
              color={theme.colors.warning}
              badge={dashboardData?.claims?.pending ? `${dashboardData.claims.pending} pending` : null}
              onPress={() => navigation.navigate('InsurerClaims')}
            />
            <QuickActionCard
              title="Policy Numbers"
              description="View next available policy numbers"
              icon="hash"
              color={theme.colors.info}
              onPress={() => navigation.navigate('InsurerPolicyNumbers')}
            />
            <QuickActionCard
              title="Statements"
              description="Generate and manage statements"
              icon="receipt"
              color={theme.colors.secondary}
              onPress={() => navigation.navigate('InsurerStatements')}
            />
            <QuickActionCard
              title="Bond Management"
              description="Create and manage bonds"
              icon="shield"
              color={theme.colors.success}
              onPress={() => navigation.navigate('InsurerBonds')}
            />
            <QuickActionCard
              title="Reports"
              description="View analytics and reports"
              icon="analytics"
              color={theme.colors.textSecondary}
              onPress={() => navigation.navigate('InsurerReports')}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {dashboardData?.recentActivity?.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                  <Ionicons name={activity.icon} size={responsiveFontSize(20)} color={activity.color} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
                {activity.status && (
                  <View style={[styles.statusBadge, { backgroundColor: activity.statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: activity.statusColor }]}>{activity.status}</Text>
                  </View>
                )}
              </View>
            )) || (
              <View style={styles.noActivity}>
                <Ionicons name="time-outline" size={responsiveFontSize(48)} color={theme.colors.textSecondary} />
                <Text style={styles.noActivityText}>No recent activity</Text>
              </View>
            )}
          </View>
        </View>

        {/* Policy Types Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Policy Types</Text>
          <View style={styles.policyTypesGrid}>
            {dashboardData?.policyTypes?.map((type, index) => (
              <View key={index} style={styles.policyTypeCard}>
                <View style={styles.policyTypeHeader}>
                  <Ionicons name={type.icon} size={responsiveFontSize(20)} color={type.color} />
                  <Text style={styles.policyTypeName}>{type.name}</Text>
                </View>
                <Text style={styles.policyTypeCount}>{type.count}</Text>
                <Text style={styles.policyTypeLabel}>policies</Text>
              </View>
            )) || (
              <View style={styles.noData}>
                <Text style={styles.noDataText}>No policy data available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Registration Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registration Status</Text>
          <View style={styles.registrationCard}>
            <View style={styles.registrationHeader}>
              <Ionicons 
                name={dashboardData?.registration?.status === 'active' ? 'checkmark-circle' : 'warning'} 
                size={responsiveFontSize(24)} 
                color={dashboardData?.registration?.status === 'active' ? theme.colors.success : theme.colors.warning} 
              />
              <Text style={styles.registrationTitle}>
                {dashboardData?.registration?.status === 'active' ? 'Registration Active' : 'Registration Pending'}
              </Text>
            </View>
            <Text style={styles.registrationDescription}>
              {dashboardData?.registration?.status === 'active' 
                ? 'Your company registration is active and up to date.'
                : 'Your company registration requires attention.'
              }
            </Text>
            {dashboardData?.registration?.expiryDate && (
              <Text style={styles.registrationExpiry}>
                Expires: {new Date(dashboardData.registration.expiryDate).toLocaleDateString()}
              </Text>
            )}
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize(24),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: responsiveFontSize(14),
    color: theme.colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  connectionText: {
    fontSize: responsiveFontSize(12),
    color: theme.colors.textSecondary,
  },
  logoutButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  profileButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  welcomeTitle: {
    fontSize: responsiveFontSize(28),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: responsiveFontSize(16),
    color: theme.colors.textSecondary,
    lineHeight: responsiveFontSize(22),
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: '600',
    color: theme.colors.text,
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
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  statCardContent: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statIcon: {
    width: responsiveWidth(48),
    height: responsiveWidth(48),
    borderRadius: responsiveWidth(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  trendText: {
    fontSize: responsiveFontSize(10),
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: responsiveFontSize(24),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statTitle: {
    fontSize: responsiveFontSize(14),
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statSubtitle: {
    fontSize: responsiveFontSize(12),
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  actionCardContent: {
    flex: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionIcon: {
    width: responsiveWidth(48),
    height: responsiveWidth(48),
    borderRadius: responsiveWidth(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: responsiveFontSize(10),
    fontWeight: '600',
    color: theme.colors.white,
  },
  actionText: {
    flex: 1,
    marginBottom: theme.spacing.sm,
  },
  actionTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  actionDescription: {
    fontSize: responsiveFontSize(14),
    color: theme.colors.textSecondary,
    lineHeight: responsiveFontSize(18),
  },
  activityList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activityIcon: {
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    borderRadius: responsiveWidth(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  activityDescription: {
    fontSize: responsiveFontSize(14),
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  activityTime: {
    fontSize: responsiveFontSize(12),
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
  },
  noActivity: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  noActivityText: {
    fontSize: responsiveFontSize(16),
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  policyTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  policyTypeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    width: getCardWidth(),
    ...theme.shadows.sm,
  },
  policyTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  policyTypeName: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  policyTypeCount: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  policyTypeLabel: {
    fontSize: responsiveFontSize(12),
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  noData: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    width: '100%',
  },
  noDataText: {
    fontSize: responsiveFontSize(16),
    color: theme.colors.textSecondary,
  },
  registrationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  registrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  registrationTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  registrationDescription: {
    fontSize: responsiveFontSize(14),
    color: theme.colors.textSecondary,
    lineHeight: responsiveFontSize(20),
    marginBottom: theme.spacing.sm,
  },
  registrationExpiry: {
    fontSize: responsiveFontSize(12),
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default InsurerDashboardScreen;
