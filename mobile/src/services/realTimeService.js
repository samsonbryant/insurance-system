import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { showMessage } from 'react-native-flash-message';

class RealTimeService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return;
    }

    try {
      this.socket = io('http://localhost:3000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('Real-time connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connectionStatus', { connected: true });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Real-time connection lost:', reason);
        this.isConnected = false;
        this.emit('connectionStatus', { connected: false });
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.handleReconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Real-time connection error:', error);
        this.isConnected = false;
        this.emit('connectionStatus', { connected: false, error });
        this.handleReconnect();
      });

      // Real-time notifications
      this.socket.on('verification_update', (data) => {
        this.handleVerificationUpdate(data);
      });

      this.socket.on('company_status_update', (data) => {
        this.handleCompanyStatusUpdate(data);
      });

      this.socket.on('system_alert', (data) => {
        this.handleSystemAlert(data);
      });

      this.socket.on('new_verification', (data) => {
        this.handleNewVerification(data);
      });

    } catch (error) {
      console.error('Failed to establish real-time connection:', error);
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.socket?.connect();
      }, delay);
    }
  }

  handleVerificationUpdate(data) {
    const { verification, officer } = data;
    
    showMessage({
      message: `Verification ${verification.status.toUpperCase()}`,
      description: `Policy ${verification.policy_number} by ${officer?.first_name} ${officer?.last_name}`,
      type: verification.status === 'valid' ? 'success' : 
            verification.status === 'fake' ? 'danger' : 'warning',
      duration: 4000,
    });

    this.emit('verificationUpdate', data);
  }

  handleCompanyStatusUpdate(data) {
    const { company, status } = data;
    
    showMessage({
      message: `Company ${status}`,
      description: `${company.name} status updated`,
      type: status === 'approved' ? 'success' : 'info',
      duration: 3000,
    });

    this.emit('companyStatusUpdate', data);
  }

  handleSystemAlert(data) {
    const { type, message, severity } = data;
    
    showMessage({
      message: message,
      type: severity === 'high' ? 'danger' : 
            severity === 'medium' ? 'warning' : 'info',
      duration: 5000,
    });

    this.emit('systemAlert', data);
  }

  handleNewVerification(data) {
    const { verification, officer } = data;
    
    showMessage({
      message: 'New Verification',
      description: `Policy ${verification.policy_number} by ${officer?.first_name}`,
      type: 'info',
      duration: 3000,
    });

    this.emit('newVerification', data);
  }

  // Event system
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Room management
  joinRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-room', room);
    }
  }

  leaveRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-room', room);
    }
  }

  // Manual emit for testing
  emitEvent(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
    };
  }
}

// Singleton instance
const realTimeService = new RealTimeService();

// React hook for real-time functionality
export const useRealTime = (token) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (token) {
      realTimeService.connect(token);
      
      const handleConnectionStatus = (status) => {
        setIsConnected(status.connected);
        setConnectionError(status.error || null);
      };

      realTimeService.on('connectionStatus', handleConnectionStatus);

      return () => {
        realTimeService.off('connectionStatus', handleConnectionStatus);
      };
    }
  }, [token]);

  return {
    isConnected,
    connectionError,
    realTimeService,
  };
};

// Hook for specific real-time events
export const useRealTimeEvents = (events = []) => {
  const [eventData, setEventData] = useState({});

  useEffect(() => {
    const eventHandlers = {};

    // Handle both array of event names and object with handlers
    const eventEntries = Array.isArray(events) 
      ? events.map(event => [event, null])
      : Object.entries(events);

    eventEntries.forEach(([eventName, customHandler]) => {
      const handler = customHandler || ((data) => {
        setEventData(prev => ({
          ...prev,
          [eventName]: data,
        }));
      });

      eventHandlers[eventName] = handler;
      realTimeService.on(eventName, handler);
    });

    return () => {
      eventEntries.forEach(([eventName]) => {
        realTimeService.off(eventName, eventHandlers[eventName]);
      });
    };
  }, [events]);

  return eventData;
};

export default realTimeService;
