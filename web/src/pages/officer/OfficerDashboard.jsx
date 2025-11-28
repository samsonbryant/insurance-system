import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { verificationAPI } from '../../services/api'
import { useRealTime, useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import { Shield, History, QrCode, RefreshCw, Wifi, WifiOff, CheckCircle, XCircle } from 'lucide-react'

const OfficerDashboard = () => {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isConnected } = useRealTime()

  useRealTimeEvents({
    'verificationUpdate': () => loadDashboardData(),
    'newVerification': () => loadDashboardData(),
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await verificationAPI.getVerificationStats()
      setDashboardData(response)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, onClick, subtitle }) => (
    <div
      onClick={onClick}
      className={`card cursor-pointer hover:shadow-md transition-shadow border-l-4`}
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value || 0}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const stats = dashboardData || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Officer Dashboard</h1>
          <p className="text-gray-600 mt-1">Document verification and validation</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span className="text-sm font-medium">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          <button onClick={loadDashboardData} className="btn btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Verifications"
          value={stats.totalVerifications || 0}
          icon={Shield}
          color="#3b82f6"
          onClick={() => navigate('/history')}
          subtitle={`${stats.verificationsToday || 0} today`}
        />
        <StatCard
          title="Valid Documents"
          value={stats.validVerifications || 0}
          icon={CheckCircle}
          color="#10b981"
          onClick={() => navigate('/history')}
        />
        <StatCard
          title="Fake Documents"
          value={stats.fakeVerifications || 0}
          icon={XCircle}
          color="#ef4444"
          onClick={() => navigate('/history')}
        />
        <StatCard
          title="Pending"
          value={stats.pendingVerifications || 0}
          icon={Shield}
          color="#f59e0b"
          onClick={() => navigate('/verify')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/verify')}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left flex items-center gap-3"
            >
              <Shield className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Verify Document</p>
                <p className="text-sm text-gray-500">Verify a new insurance document</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/scanner')}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left flex items-center gap-3"
            >
              <QrCode className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">QR Scanner</p>
                <p className="text-sm text-gray-500">Scan QR code to verify</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/history')}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left flex items-center gap-3"
            >
              <History className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">View History</p>
                <p className="text-sm text-gray-500">View verification history</p>
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Verifications</h2>
          <div className="space-y-3">
            {stats.recentVerifications?.length > 0 ? (
              stats.recentVerifications.slice(0, 5).map((verification, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/verifications/${verification.id}`)}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{verification.policy_number}</p>
                      <p className="text-sm text-gray-500">
                        {verification.holder_name} • {new Date(verification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      verification.status === 'valid' ? 'bg-green-100 text-green-700' :
                      verification.status === 'fake' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {verification.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent verifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfficerDashboard
