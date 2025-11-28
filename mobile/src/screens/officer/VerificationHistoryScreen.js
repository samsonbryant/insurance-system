import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { verificationAPI } from '../../services/api';
import { useNotifications } from '../../components/NotificationProvider';
import LoadingSpinner, { LoadingCard } from '../../components/LoadingSpinner';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveFontSize, responsiveWidth, responsiveHeight } from '../../utils/responsive';

const VerificationHistoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotifications();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'valid', 'fake', 'expired', 'pending'

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const response = await verificationAPI.getVerifications({
        officer_id: user.id,
        limit: 50
      });
      setVerifications(response.verifications);
    } catch (error) {
      console.error('Error loading verifications:', error);
      showError('Failed to load verification history');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVerifications();
    setRefreshing(false);
    showSuccess('Verification history refreshed');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return theme.colors.success;
      case 'fake': return theme.colors.danger;
      case 'expired': return theme.colors.warning;
      case 'not_found': return theme.colors.secondary;
      case 'pending': return theme.colors.primary;
      default: return theme.colors.secondary;
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

  const filteredVerifications = verifications.filter(verification => 
    filter === 'all' || verification.status === filter
  );

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const VerificationCard = ({ verification }) => (
    <TouchableOpacity 
      style={styles.verificationCard}
      onPress={() => navigation.navigate('VerificationDetail', { verification })}
    >
      <View style={styles.verificationHeader}>
        <View style={styles.verificationStatus}>
          <Ionicons 
            name={getStatusIcon(verification.status)} 
            size={responsiveFontSize(24)} 
            color={getStatusColor(verification.status)} 
          />
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(verification.status) + '20' }]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(verification.status) }
            ]}>
              {verification.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.verificationTime}>
          {new Date(verification.created_at).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.policyNumber}>{verification.policy_number}</Text>
      <Text style={styles.holderName}>{verification.holder_name}</Text>
      
      {verification.reason && (
        <Text style={styles.reason} numberOfLines={2}>
          {verification.reason}
        </Text>
      )}
      
      <View style={styles.verificationFooter}>
        <View style={styles.metricItem}>
          <Ionicons name="trending-up" size={responsiveFontSize(16)} color={theme.colors.success} />
          <Text style={styles.confidenceScore}>
            {verification.confidence_score}%
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="time" size={responsiveFontSize(16)} color={theme.colors.info} />
          <Text style={styles.responseTime}>
            {verification.response_time_ms}ms
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ filterType, label, count }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive
      ]}
      onPress={() => handleFilterChange(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonTextActive
      ]}>
        {label} {count > 0 && `(${count})`}
      </Text>
    </TouchableOpacity>
  );

  const renderVerificationCard = ({ item }) => (
    <VerificationCard verification={item} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Verification History</Text>
        </View>
        <LoadingCard text="Loading verification history..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={responsiveFontSize(24)} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Verification History</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={responsiveFontSize(20)} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <FilterButton filterType="all" label="All" count={verifications.length} />
        <FilterButton filterType="valid" label="Valid" count={verifications.filter(v => v.status === 'valid').length} />
        <FilterButton filterType="fake" label="Fake" count={verifications.filter(v => v.status === 'fake').length} />
        <FilterButton filterType="expired" label="Expired" count={verifications.filter(v => v.status === 'expired').length} />
        <FilterButton filterType="pending" label="Pending" count={verifications.filter(v => v.status === 'pending').length} />
      </ScrollView>

      <FlatList
        data={filteredVerifications}
        renderItem={renderVerificationCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={responsiveFontSize(64)} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>No verifications found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? 'Start verifying documents to see them here'
                : `No ${filter} verifications found`
              }
            </Text>
            <TouchableOpacity 
              style={styles.newVerificationButton}
              onPress={() => navigation.navigate('VerifyDocument')}
            >
              <Ionicons name="add" size={responsiveFontSize(20)} color={theme.colors.surface} />
              <Text style={styles.newVerificationButtonText}>New Verification</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: theme.spacing.sm,
  },
  filterContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: theme.colors.surface,
  },
  listContainer: {
    padding: theme.spacing.lg,
    flexGrow: 1,
  },
  verificationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  statusText: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
  },
  verificationTime: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  policyNumber: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  holderName: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  reason: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: responsiveFontSize(18),
  },
  verificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceScore: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  responseTime: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.h4,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: responsiveFontSize(22),
    marginBottom: theme.spacing.xl,
  },
  newVerificationButton: {
    ...commonStyles.button,
    ...commonStyles.buttonPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  newVerificationButtonText: {
    ...commonStyles.buttonText,
    marginLeft: theme.spacing.sm,
  },
});

export default VerificationHistoryScreen;
