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
import { usersAPI } from '../../services/api';

const AdminUsersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAllUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleExportUsers = async () => {
    try {
      if (filteredUsers.length === 0) {
        showError('No users to export');
        return;
      }

      // Create CSV content
      const headers = ['Username', 'Email', 'First Name', 'Last Name', 'Role', 'Phone', 'Status', 'Last Login'];
      const csvContent = [
        headers.join(','),
        ...filteredUsers.map(user => [
          user.username,
          user.email,
          user.first_name || '',
          user.last_name || '',
          user.role,
          user.phone || '',
          user.is_active ? 'Active' : 'Inactive',
          user.last_login ? new Date(user.last_login).toLocaleDateString() : ''
        ].join(','))
      ].join('\n');

      // For web, create a downloadable file
      if (typeof window !== 'undefined') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showSuccess('Users exported successfully');
      } else {
        // For mobile, show success message
        showSuccess(`Export ready: ${filteredUsers.length} users`);
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      showError('Failed to export users');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleUserAction = (userId, action) => {
    Alert.alert(
      `${action} User`,
      `Are you sure you want to ${action.toLowerCase()} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action, 
          style: action === 'Delete' ? 'destructive' : 'default',
          onPress: () => performUserAction(userId, action)
        }
      ]
    );
  };

  const performUserAction = async (userId, action) => {
    try {
      if (action === 'Delete') {
        await usersAPI.deleteUser(userId);
        showSuccess('User deleted successfully');
      } else if (action === 'Suspend') {
        await usersAPI.suspendUser(userId);
        showSuccess('User suspended successfully');
      } else if (action === 'Activate') {
        await usersAPI.activateUser(userId);
        showSuccess('User activated successfully');
      }
      loadUsers();
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing user:`, error);
      showError(`Failed to ${action.toLowerCase()} user`);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return theme.colors.primary;
      case 'officer': return theme.colors.success;
      case 'company': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? theme.colors.success : theme.colors.danger;
  };

  const UserCard = ({ user }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user.first_name} {user.last_name}
          </Text>
          <Text style={styles.userUsername}>@{user.username}</Text>
        </View>
        <View style={styles.userBadges}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
            <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.is_active) }]}>
            <Text style={styles.statusText}>
              {user.is_active ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.userDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{user.email}</Text>
        </View>
        {user.phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{user.phone}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>
            Joined: {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {user.last_login && (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={responsiveFontSize(16)} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>
              Last login: {new Date(user.last_login).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditUser', { userId: user.id })}
        >
          <Ionicons name="create-outline" size={responsiveFontSize(16)} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        {user.is_active ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.suspendButton]}
            onPress={() => handleUserAction(user.id, 'Suspend')}
          >
            <Ionicons name="pause-outline" size={responsiveFontSize(16)} color={theme.colors.warning} />
            <Text style={styles.actionButtonText}>Suspend</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, styles.activateButton]}
            onPress={() => handleUserAction(user.id, 'Activate')}
          >
            <Ionicons name="play-outline" size={responsiveFontSize(16)} color={theme.colors.success} />
            <Text style={styles.actionButtonText}>Activate</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleUserAction(user.id, 'Delete')}
        >
          <Ionicons name="trash-outline" size={responsiveFontSize(16)} color={theme.colors.danger} />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading users..." />
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
            <Text style={styles.headerTitle}>Users Management</Text>
            <Text style={styles.headerSubtitle}>
              Manage system users and permissions
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={handleExportUsers}
            >
              <Ionicons name="download-outline" size={responsiveFontSize(20)} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('AddUser')}
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
              placeholder="Search users..."
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

        {/* Users List */}
        <View style={styles.usersContainer}>
          <Text style={styles.sectionTitle}>
            All Users ({filteredUsers.length})
          </Text>
          
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={responsiveFontSize(64)} color={theme.colors.textMuted} />
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search criteria' : 'No users have been added yet'}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
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
  usersContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  userCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userUsername: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  userBadges: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  roleText: {
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
  userDetails: {
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
  userActions: {
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

export default AdminUsersScreen;
