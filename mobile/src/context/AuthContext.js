import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import NetInfo from '@react-native-community/netinfo';
import realTimeService from '../services/realTimeService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    checkNetworkStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        try {
          // Validate token by making a test API call
          const response = await authAPI.getProfile();
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log('AuthContext: User authenticated successfully');
        } catch (tokenError) {
          console.log('AuthContext: Token validation failed, clearing auth data');
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log('AuthContext: No token or user data found');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('AuthContext: Error checking auth status:', error);
      // Clear any corrupted data
      try {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      } catch (clearError) {
        console.error('AuthContext: Error clearing corrupted data:', clearError);
      }
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const checkNetworkStatus = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });
    return unsubscribe;
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      const { user: userData, accessToken, refreshToken } = response;
      
      // Store tokens and user data
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(userData)]
      ]);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Connect to real-time service
      realTimeService.connect(accessToken);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Starting logout process...');
      setLoading(true);
      
      // Call logout API
      console.log('AuthContext: Calling logout API...');
      try {
        await authAPI.logout();
        console.log('AuthContext: Logout API call successful');
      } catch (apiError) {
        console.log('AuthContext: Logout API call failed, but continuing with local cleanup:', apiError.message);
      }
      
      // Clear stored data
      console.log('AuthContext: Clearing stored data...');
      try {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        console.log('AuthContext: Stored data cleared');
      } catch (storageError) {
        console.log('AuthContext: Error clearing storage, but continuing:', storageError.message);
      }
      
      // Clear state
      console.log('AuthContext: Clearing user state...');
      setUser(null);
      setIsAuthenticated(false);
      console.log('AuthContext: User state cleared, isAuthenticated set to false');
      
      // Disconnect from real-time service
      console.log('AuthContext: Disconnecting from real-time service...');
      try {
        realTimeService.disconnect();
        console.log('AuthContext: Real-time service disconnected');
      } catch (realtimeError) {
        console.log('AuthContext: Error disconnecting real-time service:', realtimeError.message);
      }
      
      console.log('AuthContext: Logout completed successfully');
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Unexpected logout error:', error);
      // Even if everything fails, try to clear local data
      try {
        console.log('AuthContext: Attempting emergency cleanup...');
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        setUser(null);
        setIsAuthenticated(false);
        realTimeService.disconnect();
        console.log('AuthContext: Emergency cleanup completed');
        return { success: true };
      } catch (emergencyError) {
        console.error('AuthContext: Emergency cleanup failed:', emergencyError);
        return { success: false, error: 'Failed to logout completely' };
      }
    } finally {
      setLoading(false);
      console.log('AuthContext: Logout process finished, loading set to false');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await authAPI.updateProfile(profileData);
      
      const { user: updatedUser } = response;
      
      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error.response?.data?.error || 'Update failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await authAPI.getProfile();
      const { user: userData } = response;
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Refresh user data error:', error);
      return { success: false, error: error.message };
    }
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const isAdmin = () => hasRole('admin');
  const isCompany = () => hasRole('company');
  const isOfficer = () => hasRole('officer');

  const value = {
    user,
    isAuthenticated,
    loading,
    isOnline,
    login,
    logout,
    updateProfile,
    refreshUserData,
    hasRole,
    hasAnyRole,
    isAdmin,
    isCompany,
    isOfficer,
    setLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
