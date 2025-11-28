import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

class RealTimeService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return
    }

    try {
      const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.PROD ? 'https://insurance-system.fly.dev' : 'http://localhost:3000')
      
      this.socket = io(socketUrl, {
        auth: token ? { token } : undefined,
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        timeout: 20000, // Reduced timeout
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10, // Increased attempts
        forceNew: false,
        autoConnect: true,
        // Don't fail on connection errors - let Socket.IO handle retries
        rejectUnauthorized: false
      })

      this.socket.on('connect', () => {
        console.log('Real-time connection established')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connectionStatus', { connected: true })
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Real-time connection lost:', reason)
        this.isConnected = false
        this.emit('connectionStatus', { connected: false })
        
        if (reason === 'io server disconnect') {
          this.handleReconnect()
        }
      })

      this.socket.on('connect_error', (error) => {
        // Suppress timeout errors - they're expected during connection attempts
        // Only log other connection errors
        if (!error.message?.includes('timeout') && !error.message?.includes('xhr poll error')) {
          console.warn('Real-time connection error:', error.message)
        }
        this.isConnected = false
        this.emit('connectionStatus', { connected: false, error: error.message })
        // Don't manually reconnect - Socket.IO handles this automatically
      })

      // Real-time notifications
      this.socket.on('verification_update', (data) => {
        this.handleVerificationUpdate(data)
      })

      this.socket.on('company_status_update', (data) => {
        this.handleCompanyStatusUpdate(data)
      })

      this.socket.on('system_alert', (data) => {
        this.handleSystemAlert(data)
      })

      this.socket.on('new_verification', (data) => {
        this.handleNewVerification(data)
      })

      this.socket.on('policy-approved', (data) => {
        this.emit('policy-approved', data)
      })

      this.socket.on('policy-declined', (data) => {
        this.emit('policy-declined', data)
      })

    } catch (error) {
      console.error('Failed to establish real-time connection:', error)
    }
  }

  handleReconnect() {
    // Socket.IO handles reconnection automatically, so we just track attempts
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
    } else {
      console.warn('Max reconnection attempts reached. Please refresh the page.')
    }
  }

  handleVerificationUpdate(data) {
    const { verification, officer } = data
    
    toast.success(
      `Verification ${verification.status.toUpperCase()}: Policy ${verification.policy_number}`,
      { duration: 4000 }
    )

    this.emit('verificationUpdate', data)
  }

  handleCompanyStatusUpdate(data) {
    const { company, status } = data
    
    toast.info(`Company ${company.name} status updated to ${status}`, { duration: 4000 })
    this.emit('companyStatusUpdate', data)
  }

  handleSystemAlert(data) {
    const { message, type = 'info' } = data
    
    if (type === 'error') {
      toast.error(message, { duration: 5000 })
    } else if (type === 'warning') {
      toast(message, { icon: '⚠️', duration: 4000 })
    } else {
      toast.success(message, { duration: 4000 })
    }
    
    this.emit('systemAlert', data)
  }

  handleNewVerification(data) {
    toast.info(`New verification request: ${data.policy_number}`, { duration: 4000 })
    this.emit('newVerification', data)
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.listeners.clear()
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }
}

// Create singleton instance
const realTimeService = new RealTimeService()

// React hook for real-time connection
export const useRealTime = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    
    if (token) {
      realTimeService.connect(token)
      
      const handleConnectionStatus = (data) => {
        setIsConnected(data.connected)
        setConnectionError(data.error || null)
      }

      realTimeService.on('connectionStatus', handleConnectionStatus)

      return () => {
        realTimeService.off('connectionStatus', handleConnectionStatus)
      }
    }
  }, [])

  return {
    isConnected,
    connectionError,
    realTimeService,
    connect: (token) => realTimeService.connect(token),
    disconnect: () => realTimeService.disconnect(),
  }
}

// Hook for specific real-time events
export const useRealTimeEvents = (events = {}) => {
  useEffect(() => {
    const eventHandlers = {}
    const eventEntries = Object.entries(events)

    eventEntries.forEach(([eventName, handler]) => {
      eventHandlers[eventName] = handler
      realTimeService.on(eventName, handler)
    })

    return () => {
      eventEntries.forEach(([eventName, handler]) => {
        realTimeService.off(eventName, handler)
      })
    }
  }, [events])
}

export default realTimeService

