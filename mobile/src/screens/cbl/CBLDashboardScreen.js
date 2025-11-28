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
import { cblAPI } from '../../services/api';
import { showMessage } from 'react-native-flash-message';
import { useNotifications } from '../../components/NotificationProvider';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize, isTablet, isDesktop, getCardWidth, getGridColumns } from '../../utils/responsive';
import { useRealTime, useRealTimeEvents } from '../../services/realTimeService';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');

const CBLDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  // Real-time connection
  const { isConnected, connectionStatus } = useRealTime();
  useRealTimeEvents({
    'policy-approved': (data) => {
      showSuccess(`Policy ${data.policyNumber} approved`);
      loadDashboardData();
    },
    'policy-declined': (data) => {
      showError(`Policy ${data.policyNumber} declined: ${data.reason}`);
      loadDashboardData();
    },
    'company-registered': (data) => {
      showSuccess(`New company registered: ${data.companyName}`);
      loadDashboardData();
    },
    'company-suspended': (data) => {
      showError(`Company ${data.companyName} suspended: ${data.reason}`);
      loadDashboardData();
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await cblAPI.getDashboard();
      setDashboardData(response.dashboard);
    } catch (error) {
      console.error('Error loading CBL dashboard data:', error);
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
              console.log('CBLDashboardScreen: Starting logout process...');
              const result = await logout();
              console.log('CBLDashboardScreen: Logout result:', result);
              if (result.success) {
                showSuccess('Logged out successfully');
                console.log('CBLDashboardScreen: Logout successful, should redirect to login');
                setTimeout(() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                }, 1000);
              } else {
                showError('Failed to logout. Please try again.');
                console.log('CBLDashboardScreen: Logout failed:', result.error);
              }
            } catch (error) {
              console.error('CBLDashboardScreen: Logout error:', error);
              showError('Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const StatCard = ({ title, value, icon, color, onPress, subtitle }) => (
    <TouchableOpacity 
      style={[styles.statCard, { width: getCardWidth() }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statCardContent}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={responsiveFontSize(24)} color={color} />
        </View>
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, description, icon, color, onPress }) => (
    <TouchableOpacity 
      style={[styles.actionCard, { width: getCardWidth() }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.actionCardContent}>
        <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={responsiveFontSize(28)} color={color} />
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
        <LoadingSpinner message="Loading CBL Dashboard..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>CBL Dashboard</Text>
            <Text style={styles.headerSubtitle}>Central Bank of Liberia</Text>
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
          <Text style={styles.welcomeTitle}>Welcome, {user?.first_name || 'CBL Officer'}</Text>
          <Text style={styles.welcomeSubtitle}>
            Monitor and manage insurance companies, policies, and compliance
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Companies"
              value={dashboardData?.companies?.total || 0}
              icon="business-outline"
              color={theme.colors.primary}
              subtitle={`${dashboardData?.companies?.approved || 0} approved`}
              onPress={() => navigation.navigate('CBLCompanies')}
            />
            <StatCard
              title="Policies"
              value={dashboardData?.policies?.total || 0}
              icon="document-text-outline"
              color={theme.colors.info}
              subtitle={`${dashboardData?.policies?.pending || 0} pending`}
              onPress={() => navigation.navigate('CBLPolicies')}
            />
            <StatCard
              title="Approvals"
              value={dashboardData?.approvals?.pending || 0}
              icon="checkmark-circle-outline"
              color={theme.colors.warning}
              subtitle="Pending review"
              onPress={() => navigation.navigate('CBLApprovals')}
            />
            <StatCard
              title="Bonds"
              value={dashboardData?.bonds?.total || 0}
              icon="shield-outline"
              color={theme.colors.success}
              subtitle={`${dashboardData?.bonds?.active || 0} active`}
              onPress={() => navigation.navigate('CBLBonds')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickActionCard
              title="Company Management"
              description="Approve, suspend, or manage insurance companies"
              icon="business"
              color={theme.colors.primary}
              onPress={() => navigation.navigate('CBLCompanies')}
            />
            <QuickActionCard
              title="Policy Approvals"
              description="Review and approve pending policy applications"
              icon="document-check"
              color={theme.colors.info}
              onPress={() => navigation.navigate('CBLApprovals')}
            />
            <QuickActionCard
              title="Reference Checks"
              description="Perform background checks and verification"
              icon="search"
              color={theme.colors.warning}
              onPress={() => navigation.navigate('CBLReferenceChecks')}
            />
            <QuickActionCard
              title="Bond Management"
              description="Monitor and manage insurance bonds"
              icon="shield"
              color={theme.colors.success}
              onPress={() => navigation.navigate('CBLBonds')}
            />
            <QuickActionCard
              title="Reports & Analytics"
              description="View comprehensive reports and analytics"
              icon="analytics"
              color={theme.colors.secondary}
              onPress={() => navigation.navigate('CBLReports')}
            />
            <QuickActionCard
              title="System Settings"
              description="Configure system settings and preferences"
              icon="settings"
              color={theme.colors.textSecondary}
              onPress={() => navigation.navigate('CBLSettings')}
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
              </View>
            )) || (
              <View style={styles.noActivity}>
                <Ionicons name="time-outline" size={responsiveFontSize(48)} color={theme.colors.textSecondary} />
                <Text style={styles.noActivityText}>No recent activity</Text>
              </View>
            )}
          </View>
        </View>

        {/* Compliance Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Status</Text>
          <View style={styles.complianceCard}>
            <View style={styles.complianceHeader}>
              <Ionicons name="shield-checkmark" size={responsiveFontSize(24)} color={theme.colors.success} />
              <Text style={styles.complianceTitle}>System Compliance</Text>
            </View>
            <View style={styles.complianceStats}>
              <View style={styles.complianceStat}>
                <Text style={styles.complianceStatValue}>{dashboardData?.compliance?.companiesCompliant || 0}</Text>
                <Text style={styles.complianceStatLabel}>Companies Compliant</Text>
              </View>
              <View style={styles.complianceStat}>
                <Text style={styles.complianceStatValue}>{dashboardData?.compliance?.policiesApproved || 0}</Text>
                <Text style={styles.complianceStatLabel}>Policies Approved</Text>
              </View>
              <View style={styles.complianceStat}>
                <Text style={styles.complianceStatValue}>{dashboardData?.compliance?.bondsActive || 0}</Text>
                <Text style={styles.complianceStatLabel}>Active Bonds</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: responsiveWidth(48),
    height: responsiveWidth(48),
    borderRadius: responsiveWidth(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: responsiveWidth(48),
    height: responsiveWidth(48),
    borderRadius: responsiveWidth(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  actionText: {
    flex: 1,
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
  noActivity: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  noActivityText: {
    fontSize: responsiveFontSize(16),
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  complianceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  complianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  complianceTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  complianceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  complianceStat: {
    alignItems: 'center',
  },
  complianceStatValue: {
    fontSize: responsiveFontSize(24),
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: theme.spacing.xs,
  },
  complianceStatLabel: {
    fontSize: responsiveFontSize(12),
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default CBLDashboardScreen;
