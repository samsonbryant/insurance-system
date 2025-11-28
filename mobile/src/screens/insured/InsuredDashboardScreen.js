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
import { insuredAPI } from '../../services/api';
import { showMessage } from 'react-native-flash-message';
import { useNotifications } from '../../components/NotificationProvider';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize, isTablet, isDesktop, getCardWidth, getGridColumns } from '../../utils/responsive';
import { useRealTime, useRealTimeEvents } from '../../services/realTimeService';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');

const InsuredDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  // Real-time connection
  const { isConnected, connectionStatus } = useRealTime();
  useRealTimeEvents({
    'policy-approved': (data) => {
      showSuccess(`Your policy ${data.policyNumber} has been approved`);
      loadDashboardData();
    },
    'claim-updated': (data) => {
      showSuccess(`Claim ${data.claimId} status updated: ${data.status}`);
      loadDashboardData();
    },
    'statement-generated': (data) => {
      showSuccess(`New statement available for policy ${data.policyNumber}`);
      loadDashboardData();
    },
    'policy-expiring': (data) => {
      showError(`Policy ${data.policyNumber} expires in ${data.daysLeft} days`);
      loadDashboardData();
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await insuredAPI.getDashboard();
      setDashboardData(response.dashboard);
    } catch (error) {
      console.error('Error loading insured dashboard data:', error);
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
              console.log('InsuredDashboardScreen: Starting logout process...');
              const result = await logout();
              console.log('InsuredDashboardScreen: Logout result:', result);
              if (result.success) {
                showSuccess('Logged out successfully');
                console.log('InsuredDashboardScreen: Logout successful, should redirect to login');
                setTimeout(() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                }, 1000);
              } else {
                showError('Failed to logout. Please try again.');
                console.log('InsuredDashboardScreen: Logout failed:', result.error);
              }
            } catch (error) {
              console.error('InsuredDashboardScreen: Logout error:', error);
              showError('Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const StatCard = ({ title, value, icon, color, onPress, subtitle, status }) => (
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
          {status && (
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
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

  const QuickActionCard = ({ title, description, icon, color, onPress, badge, disabled }) => (
    <TouchableOpacity 
      style={[
        styles.actionCard, 
        { width: getCardWidth() },
        disabled && styles.actionCardDisabled
      ]} 
      onPress={disabled ? null : onPress}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <View style={styles.actionCardContent}>
        <View style={styles.actionHeader}>
          <View style={[
            styles.actionIcon, 
            { backgroundColor: color + '20' },
            disabled && styles.actionIconDisabled
          ]}>
            <Ionicons 
              name={icon} 
              size={responsiveFontSize(28)} 
              color={disabled ? theme.colors.textSecondary : color} 
            />
          </View>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <View style={styles.actionText}>
          <Text style={[styles.actionTitle, disabled && styles.actionTitleDisabled]}>{title}</Text>
          <Text style={[styles.actionDescription, disabled && styles.actionDescriptionDisabled]}>
            {description}
          </Text>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={responsiveFontSize(20)} 
          color={disabled ? theme.colors.textSecondary : theme.colors.textSecondary} 
        />
      </View>
    </TouchableOpacity>
  );

  const PolicyCard = ({ policy, onPress }) => (
    <TouchableOpacity 
      style={[styles.policyCard, { width: getCardWidth() }]} 
      onPress={() => onPress(policy)}
      activeOpacity={0.7}
    >
      <View style={styles.policyCardContent}>
        <View style={styles.policyHeader}>
          <View style={styles.policyInfo}>
            <Text style={styles.policyNumber}>{policy.policy_number}</Text>
            <Text style={styles.policyType}>{policy.policy_type}</Text>
          </View>
          <View style={[
            styles.policyStatusBadge, 
            { backgroundColor: policy.status === 'active' ? theme.colors.success + '20' : theme.colors.warning + '20' }
          ]}>
            <Text style={[
              styles.policyStatusText, 
              { color: policy.status === 'active' ? theme.colors.success : theme.colors.warning }
            ]}>
              {policy.status}
            </Text>
          </View>
        </View>
        <View style={styles.policyDetails}>
          <Text style={styles.policyHolder}>{policy.holder_name}</Text>
          <Text style={styles.policyExpiry}>
            Expires: {new Date(policy.expiry_date).toLocaleDateString()}
          </Text>
          {policy.coverage_amount && (
            <Text style={styles.policyCoverage}>
              Coverage: ${policy.coverage_amount.toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading Insured Dashboard..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>My Policies</Text>
            <Text style={styles.headerSubtitle}>Policy Holder Dashboard</Text>
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
          <Text style={styles.welcomeTitle}>Welcome, {user?.first_name || 'Policy Holder'}</Text>
          <Text style={styles.welcomeSubtitle}>
            Manage your insurance policies, claims, and statements
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Active Policies"
              value={dashboardData?.policies?.active || 0}
              icon="document-text-outline"
              color={theme.colors.primary}
              subtitle={`${dashboardData?.policies?.total || 0} total`}
              status={dashboardData?.policies?.expiring ? { text: 'Expiring Soon', color: theme.colors.warning } : null}
              onPress={() => navigation.navigate('InsuredPolicies')}
            />
            <StatCard
              title="Claims"
              value={dashboardData?.claims?.total || 0}
              icon="warning-outline"
              color={theme.colors.warning}
              subtitle={`${dashboardData?.claims?.reported || 0} reported`}
              status={dashboardData?.claims?.pending ? { text: 'Pending', color: theme.colors.warning } : null}
              onPress={() => navigation.navigate('InsuredClaims')}
            />
            <StatCard
              title="Statements"
              value={dashboardData?.statements?.total || 0}
              icon="receipt-outline"
              color={theme.colors.info}
              subtitle={`${dashboardData?.statements?.available || 0} available`}
              onPress={() => navigation.navigate('InsuredStatements')}
            />
            <StatCard
              title="Verifications"
              value={dashboardData?.verifications?.total || 0}
              icon="checkmark-circle-outline"
              color={theme.colors.success}
              subtitle={`${dashboardData?.verifications?.successful || 0} successful`}
              onPress={() => navigation.navigate('InsuredVerificationHistory')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickActionCard
              title="View Policies"
              description="View all your insurance policies"
              icon="document-text"
              color={theme.colors.primary}
              onPress={() => navigation.navigate('InsuredPolicies')}
            />
            <QuickActionCard
              title="Report Claim"
              description="Report a new insurance claim"
              icon="add-circle"
              color={theme.colors.warning}
              onPress={() => navigation.navigate('InsuredReportClaim')}
            />
            <QuickActionCard
              title="Download Statements"
              description="Download policy statements"
              icon="download"
              color={theme.colors.info}
              onPress={() => navigation.navigate('InsuredStatements')}
            />
            <QuickActionCard
              title="Verify Policy"
              description="Verify policy information"
              icon="checkmark-circle"
              color={theme.colors.success}
              onPress={() => navigation.navigate('InsuredVerifyPolicy')}
            />
            <QuickActionCard
              title="Claim History"
              description="View claim history and status"
              icon="time"
              color={theme.colors.secondary}
              onPress={() => navigation.navigate('InsuredClaims')}
            />
            <QuickActionCard
              title="Help & Support"
              description="Get help and support"
              icon="help-circle"
              color={theme.colors.textSecondary}
              onPress={() => navigation.navigate('InsuredSupport')}
            />
          </View>
        </View>

        {/* My Policies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Policies</Text>
          <View style={styles.policiesGrid}>
            {dashboardData?.policies?.recent?.map((policy, index) => (
              <PolicyCard
                key={index}
                policy={policy}
                onPress={(policy) => navigation.navigate('InsuredPolicyDetail', { policy })}
              />
            )) || (
              <View style={styles.noPolicies}>
                <Ionicons name="document-outline" size={responsiveFontSize(48)} color={theme.colors.textSecondary} />
                <Text style={styles.noPoliciesText}>No policies found</Text>
                <Text style={styles.noPoliciesSubtext}>Contact your insurance company to get started</Text>
              </View>
            )}
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

        {/* Important Notices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Notices</Text>
          <View style={styles.noticesList}>
            {dashboardData?.notices?.map((notice, index) => (
              <View key={index} style={styles.noticeCard}>
                <View style={styles.noticeHeader}>
                  <Ionicons 
                    name={notice.type === 'warning' ? 'warning' : 'information-circle'} 
                    size={responsiveFontSize(20)} 
                    color={notice.type === 'warning' ? theme.colors.warning : theme.colors.info} 
                  />
                  <Text style={styles.noticeTitle}>{notice.title}</Text>
                </View>
                <Text style={styles.noticeDescription}>{notice.description}</Text>
                <Text style={styles.noticeDate}>{notice.date}</Text>
              </View>
            )) || (
              <View style={styles.noNotices}>
                <Ionicons name="checkmark-circle" size={responsiveFontSize(48)} color={theme.colors.success} />
                <Text style={styles.noNoticesText}>All up to date!</Text>
                <Text style={styles.noNoticesSubtext}>No important notices at this time</Text>
              </View>
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
  statusBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: responsiveFontSize(10),
    fontWeight: '600',
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
  actionCardDisabled: {
    opacity: 0.5,
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
  actionIconDisabled: {
    backgroundColor: theme.colors.textSecondary + '20',
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
  actionTitleDisabled: {
    color: theme.colors.textSecondary,
  },
  actionDescription: {
    fontSize: responsiveFontSize(14),
    color: theme.colors.textSecondary,
    lineHeight: responsiveFontSize(18),
  },
  actionDescriptionDisabled: {
    color: theme.colors.textSecondary,
  },
  policiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  policyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  policyCardContent: {
    flex: 1,
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  policyInfo: {
    flex: 1,
  },
  policyNumber: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: theme.colors.text,
  },
  policyType: {
    fontSize: responsiveFontSize(12),
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  policyStatusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  policyStatusText: {
    fontSize: responsiveFontSize(10),
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  policyDetails: {
    flex: 1,
  },
  policyHolder: {
    fontSize: responsiveFontSize(14),
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  policyExpiry: {
    fontSize: responsiveFontSize(12),
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  policyCoverage: {
    fontSize: responsiveFontSize(12),
    color: theme.colors.textSecondary,
  },
  noPolicies: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    width: '100%',
  },
  noPoliciesText: {
    fontSize: responsiveFontSize(16),
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  noPoliciesSubtext: {
    fontSize: responsiveFontSize(14),
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
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
  noticesList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  noticeCard: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  noticeTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  noticeDescription: {
    fontSize: responsiveFontSize(14),
    color: theme.colors.textSecondary,
    lineHeight: responsiveFontSize(20),
    marginBottom: theme.spacing.xs,
  },
  noticeDate: {
    fontSize: responsiveFontSize(12),
    color: theme.colors.textSecondary,
  },
  noNotices: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  noNoticesText: {
    fontSize: responsiveFontSize(16),
    color: theme.colors.success,
    marginTop: theme.spacing.md,
  },
  noNoticesSubtext: {
    fontSize: responsiveFontSize(14),
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});

export default InsuredDashboardScreen;
