import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import LoadingScreen from '../screens/common/LoadingScreen';
import PlaceholderScreen from '../screens/common/PlaceholderScreen';

// Admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminCompaniesScreen from '../screens/admin/AdminCompaniesScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import CompanyDetailScreen from '../screens/admin/CompanyDetailScreen';
import AddUserScreen from '../screens/admin/AddUserScreen';
import EditUserScreen from '../screens/admin/EditUserScreen';

// Officer screens
import OfficerDashboardScreen from '../screens/officer/OfficerDashboardScreen';
import VerifyDocumentScreen from '../screens/officer/VerifyDocumentScreen';
import VerificationHistoryScreen from '../screens/officer/VerificationHistoryScreen';
import OfficerReportsScreen from '../screens/officer/OfficerReportsScreen';
import VerificationDetailScreen from '../screens/officer/VerificationDetailScreen';
import QRScannerScreen from '../screens/officer/QRScannerScreen';

// Company screens
import CompanyDashboardScreen from '../screens/company/CompanyDashboardScreen';
import CompanyPoliciesScreen from '../screens/company/CompanyPoliciesScreen';
import CompanyReportsScreen from '../screens/company/CompanyReportsScreen';
import EditPolicyScreen from '../screens/company/EditPolicyScreen';
import AddPolicyScreen from '../screens/company/AddPolicyScreen';

// CBL screens
import CBLDashboardScreen from '../screens/cbl/CBLDashboardScreen';

// Insurer screens
import InsurerDashboardScreen from '../screens/insurer/InsurerDashboardScreen';

// Insured screens
import InsuredDashboardScreen from '../screens/insured/InsuredDashboardScreen';

// Common screens
import ProfileScreen from '../screens/common/ProfileScreen';
import AboutScreen from '../screens/common/AboutScreen';
import ReportDetailsScreen from '../screens/common/ReportDetailsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Admin Tab Navigator
const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AdminDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AdminCompanies') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'AdminUsers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'AdminReports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'AdminSettings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="AdminCompanies" 
        component={AdminCompaniesScreen}
        options={{ title: 'Companies' }}
      />
      <Tab.Screen 
        name="AdminUsers" 
        component={AdminUsersScreen}
        options={{ title: 'Users' }}
      />
      <Tab.Screen 
        name="AdminReports" 
        component={AdminReportsScreen}
        options={{ title: 'Reports' }}
      />
      <Tab.Screen 
        name="AdminSettings" 
        component={AdminSettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Company Tab Navigator
const CompanyTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'CompanyDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CompanyPolicies') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'CompanyReports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'CompanySettings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="CompanyDashboard" 
        component={CompanyDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="CompanyPolicies" 
        component={CompanyPoliciesScreen}
        options={{ title: 'Policies' }}
      />
      <Tab.Screen 
        name="CompanyReports" 
        component={CompanyReportsScreen}
        options={{ title: 'Reports' }}
      />
      <Tab.Screen 
        name="CompanySettings" 
        component={PlaceholderScreen}
        options={{ title: 'Settings' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Officer Tab Navigator
const OfficerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'OfficerDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'VerifyDocument') {
            iconName = focused ? 'scan' : 'scan-outline';
          } else if (route.name === 'VerificationHistory') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'OfficerReports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'OfficerSettings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="OfficerDashboard" 
        component={OfficerDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="VerifyDocument" 
        component={VerifyDocumentScreen}
        options={{ title: 'Verify' }}
      />
      <Tab.Screen 
        name="VerificationHistory" 
        component={VerificationHistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen 
        name="OfficerReports" 
        component={OfficerReportsScreen}
        options={{ title: 'Reports' }}
      />
      <Tab.Screen 
        name="OfficerSettings" 
        component={PlaceholderScreen}
        options={{ title: 'Settings' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// CBL Tab Navigator
const CBLTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'CBLDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CBLCompanies') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'CBLApprovals') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'CBLBonds') {
            iconName = focused ? 'shield' : 'shield-outline';
          } else if (route.name === 'CBLReports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="CBLDashboard" 
        component={CBLDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="CBLCompanies" 
        component={PlaceholderScreen}
        options={{ title: 'Companies' }}
      />
      <Tab.Screen 
        name="CBLApprovals" 
        component={PlaceholderScreen}
        options={{ title: 'Approvals' }}
      />
      <Tab.Screen 
        name="CBLBonds" 
        component={PlaceholderScreen}
        options={{ title: 'Bonds' }}
      />
      <Tab.Screen 
        name="CBLReports" 
        component={PlaceholderScreen}
        options={{ title: 'Reports' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Insurer Tab Navigator
const InsurerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'InsurerDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'InsurerPolicies') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'InsurerClaims') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'InsurerBonds') {
            iconName = focused ? 'shield' : 'shield-outline';
          } else if (route.name === 'InsurerReports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="InsurerDashboard" 
        component={InsurerDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="InsurerPolicies" 
        component={PlaceholderScreen}
        options={{ title: 'Policies' }}
      />
      <Tab.Screen 
        name="InsurerClaims" 
        component={PlaceholderScreen}
        options={{ title: 'Claims' }}
      />
      <Tab.Screen 
        name="InsurerBonds" 
        component={PlaceholderScreen}
        options={{ title: 'Bonds' }}
      />
      <Tab.Screen 
        name="InsurerReports" 
        component={PlaceholderScreen}
        options={{ title: 'Reports' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Insured Tab Navigator
const InsuredTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'InsuredDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'InsuredPolicies') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'InsuredClaims') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'InsuredStatements') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'InsuredVerification') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="InsuredDashboard" 
        component={InsuredDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="InsuredPolicies" 
        component={PlaceholderScreen}
        options={{ title: 'Policies' }}
      />
      <Tab.Screen 
        name="InsuredClaims" 
        component={PlaceholderScreen}
        options={{ title: 'Claims' }}
      />
      <Tab.Screen 
        name="InsuredStatements" 
        component={PlaceholderScreen}
        options={{ title: 'Statements' }}
      />
      <Tab.Screen 
        name="InsuredVerification" 
        component={PlaceholderScreen}
        options={{ title: 'Verify' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, loading, user } = useAuth();

  console.log('AppNavigator: isAuthenticated =', isAuthenticated, 'loading =', loading, 'user =', user?.username);

  if (loading) {
    console.log('AppNavigator: Showing loading screen');
    return <LoadingScreen />;
  }

  console.log('AppNavigator: Rendering navigation, isAuthenticated =', isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          {user?.role === 'admin' && (
            <Stack.Screen name="AdminMain" component={AdminTabNavigator} />
          )}
          {user?.role === 'company' && (
            <Stack.Screen name="CompanyMain" component={CompanyTabNavigator} />
          )}
          {user?.role === 'officer' && (
            <Stack.Screen name="OfficerMain" component={OfficerTabNavigator} />
          )}
          {user?.role === 'cbl' && (
            <Stack.Screen name="CBLMain" component={CBLTabNavigator} />
          )}
          {user?.role === 'insurer' && (
            <Stack.Screen name="InsurerMain" component={InsurerTabNavigator} />
          )}
          {user?.role === 'insured' && (
            <Stack.Screen name="InsuredMain" component={InsuredTabNavigator} />
          )}
          
          {/* Common screens accessible from any role */}
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ 
              headerShown: true,
              title: 'Profile',
              headerBackTitle: 'Back'
            }}
          />
          <Stack.Screen 
            name="About" 
            component={AboutScreen}
            options={{ 
              headerShown: true,
              title: 'About',
              headerBackTitle: 'Back'
            }}
          />
          
          {/* Admin-specific screens */}
          <Stack.Screen 
            name="CompanyDetail" 
            component={CompanyDetailScreen}
            options={{ 
              headerShown: false,
              title: 'Company Details'
            }}
          />
          <Stack.Screen 
            name="AddUser" 
            component={AddUserScreen}
            options={{ 
              headerShown: false,
              title: 'Add User'
            }}
          />
          <Stack.Screen 
            name="EditUser" 
            component={EditUserScreen}
            options={{ 
              headerShown: false,
              title: 'Edit User'
            }}
          />
          
          {/* Officer-specific screens */}
          <Stack.Screen 
            name="VerificationDetail" 
            component={VerificationDetailScreen}
            options={{ 
              headerShown: false,
              title: 'Verification Details'
            }}
          />
          <Stack.Screen 
            name="QRScanner" 
            component={QRScannerScreen}
            options={{ 
              headerShown: false,
              title: 'QR Scanner'
            }}
          />
          
          {/* Company-specific screens */}
          <Stack.Screen 
            name="EditPolicy" 
            component={EditPolicyScreen}
            options={{ 
              headerShown: false,
              title: 'Edit Policy'
            }}
          />
          <Stack.Screen 
            name="AddPolicy" 
            component={AddPolicyScreen}
            options={{ 
              headerShown: false,
              title: 'Add Policy'
            }}
          />
          
          {/* Common screens */}
          <Stack.Screen 
            name="ReportDetails" 
            component={ReportDetailsScreen}
            options={{ 
              headerShown: false,
              title: 'Report Details'
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
