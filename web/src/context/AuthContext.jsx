import React, { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '../services/api'
import realTimeService from '../services/realTimeService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const userData = localStorage.getItem('user')
      
      if (token && userData) {
        try {
          // Validate token by making a test API call
          await authAPI.getProfile()
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          setIsAuthenticated(true)
          
          // Connect to real-time service
          realTimeService.connect(token)
        } catch (tokenError) {
          console.log('Token validation failed, clearing auth data')
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          setUser(null)
          setIsAuthenticated(false)
        }
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setLoading(true)
      const response = await authAPI.login(credentials)
      
      // Handle different response structures
      const userData = response.user || response
      const accessToken = response.accessToken || response.token
      const refreshToken = response.refreshToken
      
      if (!accessToken || !userData) {
        throw new Error('Invalid response from server')
      }
      
      // Store tokens and user data
      localStorage.setItem('accessToken', accessToken)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      localStorage.setItem('user', JSON.stringify(userData))
      
      setUser(userData)
      setIsAuthenticated(true)
      
      // Connect to real-time service
      realTimeService.connect(accessToken)
      
      return { success: true, user: userData }
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = 'Login failed'
      
      if (error.response) {
        // Server responded with error
        if (error.response.status === 429) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.'
        } else if (error.response.status === 401) {
          errorMessage = error.response.data?.error || 'Invalid username or password'
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Disconnect real-time service
      realTimeService.disconnect()
      
      // Clear local storage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      const updatedUser = { ...user, ...response.user }
      
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      return { success: true, user: updatedUser }
    } catch (error) {
      console.error('Update profile error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to update profile'
      return { success: false, error: errorMessage }
    }
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateProfile,
    checkAuthStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

