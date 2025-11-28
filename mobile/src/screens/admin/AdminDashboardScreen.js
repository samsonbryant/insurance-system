import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { reportsAPI } from '../../services/api';
import { showMessage } from 'react-native-flash-message';
import { useNotifications } from '../../components/NotificationProvider';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize, isTablet, isDesktop, getCardWidth, getGridColumns } from '../../utils/responsive';
import { useRealTime, useRealTimeEvents } from '../../services/realTimeService';

const AdminDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Real-time functionality
  const { isConnected, connectionError } = useRealTime(user?.accessToken);
  const realTimeData = useRealTimeEvents(['verificationUpdate', 'companyStatusUpdate', 'systemAlert', 'newVerification']);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Update dashboard when real-time data changes
  useEffect(() => {
    if (realTimeData.verificationUpdate || realTimeData.companyStatusUpdate) {
      loadDashboardData();
    }
  }, [realTimeData]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getDashboardStats();
      setDashboardData(response.dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showMessage({
        message: 'Failed to load dashboard data',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, icon, color, onPress }) => (
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
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const handleLogout = async () => {
    try {
      await logout();
      showMessage({
        message: 'Logged out successfully',
        type: 'success',
      });
    } catch (error) {
      showMessage({
        message: 'Logout failed',
        type: 'danger',
      });
    }
  };

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
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.first_name || user?.username}</Text>
            {/* Real-time connection indicator */}
            <View style={styles.connectionStatus}>
              <Ionicons 
                name={isConnected ? "wifi" : "wifi-outline"} 
                size={16} 
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
                          console.log('AdminDashboardScreen: Starting logout process...');
                          const result = await logout();
                          console.log('AdminDashboardScreen: Logout result:', result);
                          if (result.success) {
                            showSuccess('Logged out successfully');
                            console.log('AdminDashboardScreen: Logout successful, should redirect to login');
                            // Force navigation reset to ensure proper redirect
                            setTimeout(() => {
                              navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                              });
                            }, 1000);
                          } else {
                            showError('Failed to logout. Please try again.');
                            console.log('AdminDashboardScreen: Logout failed:', result.error);
                          }
                        } catch (error) {
                          console.error('AdminDashboardScreen: Logout error:', error);
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
            <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-circle" size={responsiveFontSize(40)} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Verifications"
              value={dashboardData?.overview?.total_verifications || 0}
              icon="checkmark-circle"
              color="#28a745"
              onPress={() => navigation.navigate('AdminReports')}
            />
            <StatCard
              title="Total Policies"
              value={dashboardData?.overview?.total_policies || 0}
              icon="document-text"
              color="#007AFF"
              onPress={() => navigation.navigate('AdminReports')}
            />
            <StatCard
              title="Recent (24h)"
              value={dashboardData?.overview?.recent_verifications_24h || 0}
              icon="time"
              color="#ffc107"
              onPress={() => navigation.navigate('AdminReports')}
            />
            <StatCard
              title="Fake Detections"
              value={dashboardData?.overview?.fake_detections_7d || 0}
              icon="warning"
              color="#dc3545"
              onPress={() => navigation.navigate('AdminReports')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <QuickActionCard
            title="Manage Companies"
            description="View and approve company registrations"
            icon="business"
            color="#007AFF"
            onPress={() => navigation.navigate('AdminCompanies')}
          />
          <QuickActionCard
            title="User Management"
            description="Add, edit, and manage system users"
            icon="people"
            color="#28a745"
            onPress={() => navigation.navigate('AdminUsers')}
          />
          <QuickActionCard
            title="View Reports"
            description="Generate and view system reports"
            icon="bar-chart"
            color="#ffc107"
            onPress={() => navigation.navigate('AdminReports')}
          />
          <QuickActionCard
            title="System Settings"
            description="Configure system parameters"
            icon="settings"
            color="#6c757d"
            onPress={() => navigation.navigate('AdminSettings')}
          />
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.activityText}>System running normally</Text>
              <Text style={styles.activityTime}>Just now</Text>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="sync" size={20} color="#007AFF" />
              <Text style={styles.activityText}>Data sync completed</Text>
              <Text style={styles.activityTime}>5 min ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="warning" size={20} color="#ffc107" />
              <Text style={styles.activityText}>Fake document detected</Text>
              <Text style={styles.activityTime}>15 min ago</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#dc3545" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
  greeting: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  userName: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  connectionText: {
    ...theme.typography.caption,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  profileButton: {
    padding: theme.spacing.sm,
  },
  statsContainer: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
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
    padding: theme.spacing.md,
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
  },
  statCardIcon: {
    width: responsiveWidth(40),
    height: responsiveHeight(40),
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  quickActionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  quickActionIcon: {
    width: responsiveWidth(40),
    height: responsiveHeight(40),
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
  recentActivityContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  activityText: {
    flex: 1,
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.md,
  },
  activityTime: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  logoutButtonText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.danger,
    marginLeft: theme.spacing.sm,
  },
});

export default AdminDashboardScreen;
