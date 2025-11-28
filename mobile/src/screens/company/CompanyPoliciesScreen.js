import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../components/NotificationProvider';
import LoadingSpinner from '../../components/LoadingSpinner';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../../utils/responsive';
import { policiesAPI } from '../../services/api';

const CompanyPoliciesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadPolicies();
  }, []);

  useEffect(() => {
    filterPolicies();
  }, [policies, searchQuery, filterStatus]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const response = await policiesAPI.getPolicies();
      setPolicies(response.policies || []);
    } catch (error) {
      console.error('Error loading policies:', error);
      showError('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const filterPolicies = () => {
    let filtered = policies;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(policy => policy.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(policy => 
        policy.policy_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.holder_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.policy_type?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPolicies(filtered);
  };

  const handleExportPolicies = async () => {
    try {
      if (filteredPolicies.length === 0) {
        showError('No policies to export');
        return;
      }

      // Create CSV content
      const headers = ['Policy Number', 'Holder Name', 'Policy Type', 'Status', 'Coverage Amount', 'Premium Amount', 'Start Date', 'Expiry Date'];
      const csvContent = [
        headers.join(','),
        ...filteredPolicies.map(policy => [
          policy.policy_number,
          policy.holder_name,
          policy.policy_type,
          policy.status,
          policy.coverage_amount || '',
          policy.premium_amount || '',
          policy.start_date ? new Date(policy.start_date).toLocaleDateString() : '',
          policy.expiry_date ? new Date(policy.expiry_date).toLocaleDateString() : ''
        ].join(','))
      ].join('\n');

      // For web, create a downloadable file
      if (typeof window !== 'undefined') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `policies_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showSuccess('Policies exported successfully');
      } else {
        // For mobile, show success message (file sharing would require additional setup)
        showSuccess(`Export ready: ${filteredPolicies.length} policies`);
      }
    } catch (error) {
      console.error('Error exporting policies:', error);
      showError('Failed to export policies');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPolicies();
    setRefreshing(false);
  };

  const handlePolicyAction = (policyId, action) => {
    Alert.alert(
      `${action} Policy`,
      `Are you sure you want to ${action.toLowerCase()} this policy?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action, 
          style: action === 'Delete' ? 'destructive' : 'default',
          onPress: () => performPolicyAction(policyId, action)
        }
      ]
    );
  };

  const performPolicyAction = async (policyId, action) => {
    try {
      if (action === 'Delete') {
        await policiesAPI.deletePolicy(policyId);
        showSuccess('Policy deleted successfully');
      } else if (action === 'Suspend') {
        await policiesAPI.suspendPolicy(policyId);
        showSuccess('Policy suspended successfully');
      } else if (action === 'Activate') {
        await policiesAPI.activatePolicy(policyId);
        showSuccess('Policy activated successfully');
      }
      loadPolicies();
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing policy:`, error);
      showError(`Failed to ${action.toLowerCase()} policy`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return theme.colors.success;
      case 'expired': return theme.colors.danger;
      case 'cancelled': return theme.colors.textMuted;
      case 'suspended': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  };

  const getPolicyTypeColor = (type) => {
    switch (type) {
      case 'auto': return theme.colors.primary;
      case 'health': return theme.colors.success;
      case 'life': return theme.colors.warning;
      case 'property': return theme.colors.info;
      case 'business': return theme.colors.danger;
      default: return theme.colors.textSecondary;
    }
  };

  const PolicyCard = ({ policy }) => (
    <View style={styles.policyCard}>
      <View style={styles.policyHeader}>
        <View style={styles.policyInfo}>
          <Text style={styles.policyNumber}>{policy.policy_number}</Text>
          <Text style={styles.holderName}>{policy.holder_name}</Text>
        </View>
        <View style={styles.policyBadges}>
          <View style={[styles.typeBadge, { backgroundColor: getPolicyTypeColor(policy.policy_type) }]}>
            <Text style={styles.typeText}>{policy.policy_type?.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(policy.status) }]}>
            <Text style={styles.statusText}>{policy.status?.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.policyDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>
            Start: {policy.start_date ? new Date(policy.start_date).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>
            Expiry: {policy.expiry_date ? new Date(policy.expiry_date).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        {policy.coverage_amount && (
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>
              Coverage: ${policy.coverage_amount.toLocaleString()}
            </Text>
          </View>
        )}
        {policy.premium_amount && (
          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>
              Premium: ${policy.premium_amount.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.policyActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditPolicy', { policyId: policy.id })}
        >
          <Ionicons name="create-outline" size={responsiveFontSize(16)} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        {policy.status === 'active' ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.suspendButton]}
            onPress={() => handlePolicyAction(policy.id, 'Suspend')}
          >
            <Ionicons name="pause-outline" size={responsiveFontSize(16)} color={theme.colors.warning} />
            <Text style={styles.actionButtonText}>Suspend</Text>
          </TouchableOpacity>
        ) : policy.status === 'suspended' ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.activateButton]}
            onPress={() => handlePolicyAction(policy.id, 'Activate')}
          >
            <Ionicons name="play-outline" size={responsiveFontSize(16)} color={theme.colors.success} />
            <Text style={styles.actionButtonText}>Activate</Text>
          </TouchableOpacity>
        ) : null}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handlePolicyAction(policy.id, 'Delete')}
        >
          <Ionicons name="trash-outline" size={responsiveFontSize(16)} color={theme.colors.danger} />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const FilterButton = ({ status, label, isActive, onPress }) => (
    <TouchableOpacity 
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading policies..." />
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
            <Text style={styles.headerTitle}>Policy Management</Text>
            <Text style={styles.headerSubtitle}>
              Manage your company's insurance policies
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={handleExportPolicies}
            >
              <Ionicons name="download-outline" size={responsiveFontSize(20)} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('AddPolicy')}
            >
              <Ionicons name="add" size={responsiveFontSize(24)} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={responsiveFontSize(20)} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search policies..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={responsiveFontSize(20)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <FilterButton
              status="all"
              label="All"
              isActive={filterStatus === 'all'}
              onPress={() => setFilterStatus('all')}
            />
            <FilterButton
              status="active"
              label="Active"
              isActive={filterStatus === 'active'}
              onPress={() => setFilterStatus('active')}
            />
            <FilterButton
              status="expired"
              label="Expired"
              isActive={filterStatus === 'expired'}
              onPress={() => setFilterStatus('expired')}
            />
            <FilterButton
              status="suspended"
              label="Suspended"
              isActive={filterStatus === 'suspended'}
              onPress={() => setFilterStatus('suspended')}
            />
            <FilterButton
              status="cancelled"
              label="Cancelled"
              isActive={filterStatus === 'cancelled'}
              onPress={() => setFilterStatus('cancelled')}
            />
          </ScrollView>
        </View>

        {/* Policies List */}
        <View style={styles.policiesContainer}>
          <Text style={styles.sectionTitle}>
            Policies ({filteredPolicies.length})
          </Text>
          
          {filteredPolicies.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={responsiveFontSize(64)} color={theme.colors.textMuted} />
              <Text style={styles.emptyTitle}>No policies found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'No policies have been added yet'
                }
              </Text>
            </View>
          ) : (
            filteredPolicies.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  exportButton: {
    backgroundColor: theme.colors.surface,
    width: responsiveHeight(40),
    height: responsiveHeight(40),
    borderRadius: responsiveHeight(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: responsiveHeight(48),
    height: responsiveHeight(48),
    borderRadius: responsiveHeight(24),
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: theme.colors.white,
  },
  policiesContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  policyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  policyInfo: {
    flex: 1,
  },
  policyNumber: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  holderName: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  policyBadges: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  typeText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
  },
  policyDetails: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  policyActions: {
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
  editButton: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  suspendButton: {
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.warning + '10',
  },
  activateButton: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success + '10',
  },
  deleteButton: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.danger + '10',
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
});

export default CompanyPoliciesScreen;
