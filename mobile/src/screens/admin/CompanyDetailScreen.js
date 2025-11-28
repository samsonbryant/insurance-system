import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../components/NotificationProvider';
import LoadingSpinner from '../../components/LoadingSpinner';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../../utils/responsive';

const CompanyDetailScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const { company } = route.params;
  const [loading, setLoading] = useState(false);

  const handleEditCompany = () => {
    Alert.alert(
      'Edit Company',
      'This feature will be implemented in the next update.',
      [{ text: 'OK' }]
    );
  };

  const handleSyncCompany = () => {
    Alert.alert(
      'Sync Company',
      'This feature will be implemented in the next update.',
      [{ text: 'OK' }]
    );
  };

  const DetailItem = ({ label, value, icon }) => (
    <View style={styles.detailItem}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={responsiveFontSize(20)} color={theme.colors.primary} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={responsiveFontSize(24)} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{company.name}</Text>
            <Text style={styles.headerSubtitle}>Company Details</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditCompany}
          >
            <Ionicons name="create-outline" size={responsiveFontSize(24)} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          
          <DetailItem
            label="License Number"
            value={company.license_number}
            icon="document-text"
          />
          
          <DetailItem
            label="Registration Number"
            value={company.registration_number}
            icon="business"
          />
          
          <DetailItem
            label="Status"
            value={company.status}
            icon="checkmark-circle"
          />
          
          <DetailItem
            label="Contact Email"
            value={company.contact_email}
            icon="mail"
          />
          
          <DetailItem
            label="Contact Phone"
            value={company.contact_phone}
            icon="call"
          />
          
          <DetailItem
            label="Address"
            value={company.address}
            icon="location"
          />
        </View>

        {/* API Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Configuration</Text>
          
          <DetailItem
            label="API Endpoint"
            value={company.api_endpoint}
            icon="link"
          />
          
          <DetailItem
            label="Sync Frequency"
            value={company.sync_frequency}
            icon="time"
          />
          
          <DetailItem
            label="Last Sync"
            value={company.last_sync ? new Date(company.last_sync).toLocaleString() : 'Never'}
            icon="sync"
          />
          
          <DetailItem
            label="Sync Status"
            value={company.sync_status || 'Unknown'}
            icon="checkmark-circle"
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSyncCompany}
          >
            <Ionicons name="sync-outline" size={responsiveFontSize(20)} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>Sync Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.editActionButton]}
            onPress={handleEditCompany}
          >
            <Ionicons name="create-outline" size={responsiveFontSize(20)} color={theme.colors.primary} />
            <Text style={[styles.actionButtonText, styles.editActionButtonText]}>Edit Company</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerContent: {
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
  editButton: {
    padding: theme.spacing.sm,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailIcon: {
    width: responsiveHeight(40),
    height: responsiveHeight(40),
    borderRadius: responsiveHeight(20),
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  actionsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  editActionButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    ...theme.typography.body,
    color: theme.colors.white,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  editActionButtonText: {
    color: theme.colors.primary,
  },
});

export default CompanyDetailScreen;
