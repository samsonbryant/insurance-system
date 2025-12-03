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
    let isMounted = true
    let timeoutId
    
    // Set a maximum timeout to ensure loading state is cleared
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth check taking too long, clearing loading state')
        setLoading(false)
      }
    }, 10000) // 10 second maximum

    checkAuthStatus().finally(() => {
      if (isMounted) {
        clearTimeout(timeoutId)
      }
    })

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const userData = localStorage.getItem('user')
      
      if (token && userData) {
        try {
          // Validate token by making a test API call with timeout
          const profilePromise = authAPI.getProfile()
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          )
          
          await Promise.race([profilePromise, timeoutPromise])
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          setIsAuthenticated(true)
          
          // Connect to real-time service
          realTimeService.connect(token)
        } catch (tokenError) {
          console.log('Token validation failed, clearing auth data', tokenError?.message || tokenError)
          // If it's a timeout or network error, don't clear - just set as unauthenticated
          if (tokenError.message === 'Request timeout' || !tokenError.response) {
            // Network error - keep user data but mark as unauthenticated
            setUser(null)
            setIsAuthenticated(false)
          } else {
            // Auth error - clear everything
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            setUser(null)
            setIsAuthenticated(false)
          }
        }
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      // Don't clear storage on network errors, only on auth errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
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

