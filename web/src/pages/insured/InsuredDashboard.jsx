import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { insuredAPI } from '../../services/api'
import { useRealTime, useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import { FileText, AlertCircle, Receipt, RefreshCw, Wifi, WifiOff, Plus } from 'lucide-react'

const InsuredDashboard = () => {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isConnected } = useRealTime()

  useRealTimeEvents({
    'policyUpdate': () => loadDashboardData(),
    'claimUpdate': () => loadDashboardData(),
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await insuredAPI.getDashboard()
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
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1">View your policies and claims</p>
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
          title="My Policies"
          value={stats.totalPolicies || 0}
          icon={FileText}
          color="#3b82f6"
          onClick={() => navigate('/policies')}
          subtitle={`${stats.activePolicies || 0} active`}
        />
        <StatCard
          title="My Claims"
          value={stats.totalClaims || 0}
          icon={AlertCircle}
          color="#ef4444"
          onClick={() => navigate('/claims')}
          subtitle={`${stats.pendingClaims || 0} pending`}
        />
        <StatCard
          title="Statements"
          value={stats.totalStatements || 0}
          icon={Receipt}
          color="#10b981"
          onClick={() => navigate('/statements')}
        />
        <StatCard
          title="Verifications"
          value={stats.verificationHistory || 0}
          icon={FileText}
          color="#8b5cf6"
          onClick={() => navigate('/history')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Policies</h2>
          <div className="space-y-3">
            {stats.recentPolicies?.length > 0 ? (
              stats.recentPolicies.slice(0, 5).map((policy, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/policies/${policy.id}`)}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{policy.policy_number}</p>
                      <p className="text-sm text-gray-500">{policy.policy_type}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      policy.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {policy.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent policies</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/policies')}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left flex items-center gap-3"
            >
              <FileText className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">View My Policies</p>
                <p className="text-sm text-gray-500">See all your insurance policies</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/claims')}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left flex items-center gap-3"
            >
              <Plus className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Report a Claim</p>
                <p className="text-sm text-gray-500">Submit a new insurance claim</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/statements')}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left flex items-center gap-3"
            >
              <Receipt className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">View Statements</p>
                <p className="text-sm text-gray-500">Download policy statements</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InsuredDashboard
