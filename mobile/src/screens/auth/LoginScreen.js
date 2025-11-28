import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { showMessage } from 'react-native-flash-message';
import { theme, commonStyles } from '../../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize, isTablet, isDesktop } from '../../utils/responsive';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showMessage({
        message: 'Please fill in all fields',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await login({ username: username.trim(), password });
      
      if (result.success) {
        showMessage({
          message: 'Login successful!',
          type: 'success',
        });
      } else {
        showMessage({
          message: result.error || 'Login failed',
          type: 'danger',
        });
      }
    } catch (error) {
      showMessage({
        message: 'An unexpected error occurred',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={80} color="#007AFF" />
            </View>
            <Text style={styles.title}>IVAS</Text>
            <Text style={styles.subtitle}>Insurance Verification & Authentication System</Text>
            <Text style={styles.description}>
              Secure document verification for Liberia
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Sign In</Text>
            
            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username or Email"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Secure • Reliable • Trusted
            </Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: isDesktop ? responsiveWidth(40) : theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: responsiveHeight(40),
  },
  logoContainer: {
    width: responsiveWidth(120),
    height: responsiveHeight(120),
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
  },
  description: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: responsiveWidth(300),
  },
  formContainer: {
    ...commonStyles.card,
    maxWidth: isDesktop ? responsiveWidth(400) : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  formTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceSecondary,
    minHeight: responsiveHeight(50),
  },
  inputIcon: {
    marginRight: theme.spacing.md,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: responsiveFontSize(16),
    color: theme.colors.textPrimary,
    minHeight: responsiveHeight(40),
  },
  eyeIcon: {
    padding: theme.spacing.sm,
  },
  loginButton: {
    ...commonStyles.button,
    ...commonStyles.buttonPrimary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    minHeight: responsiveHeight(50),
  },
  loginButtonDisabled: {
    backgroundColor: theme.colors.textLight,
  },
  loginButtonText: {
    ...commonStyles.buttonText,
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: responsiveHeight(40),
  },
  footerText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  versionText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
});

export default LoginScreen;
