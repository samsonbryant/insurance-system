import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useRealTime } from './services/realTimeService'
import LoadingScreen from './components/LoadingScreen'
import LoginPage from './pages/auth/LoginPage'
import AdminRoutes from './routes/AdminRoutes'
import CBLRoutes from './routes/CBLRoutes'
import InsurerRoutes from './routes/InsurerRoutes'
import InsuredRoutes from './routes/InsuredRoutes'
import CompanyRoutes from './routes/CompanyRoutes'
import OfficerRoutes from './routes/OfficerRoutes'

function AppContent() {
  const { user, loading, isAuthenticated } = useAuth()
  const { connect } = useRealTime()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to real-time service when authenticated
      const token = localStorage.getItem('accessToken')
      if (token) {
        connect(token)
      }
    }
  }, [isAuthenticated, user, connect])

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Route based on user role
  const getRoleRoutes = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminRoutes />
      case 'cbl':
        return <CBLRoutes />
      case 'insurer':
        return <InsurerRoutes />
      case 'insured':
        return <InsuredRoutes />
      case 'company':
        return <CompanyRoutes />
      case 'officer':
        return <OfficerRoutes />
      default:
        return <Navigate to="/login" replace />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/*" element={getRoleRoutes()} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

