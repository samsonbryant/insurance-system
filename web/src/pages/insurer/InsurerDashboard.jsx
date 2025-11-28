import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { insurerAPI } from '../../services/api'
import { useRealTime, useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import { FileText, AlertCircle, Receipt, Shield, TrendingUp, RefreshCw, Wifi, WifiOff, Plus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const InsurerDashboard = () => {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isConnected } = useRealTime()

  useRealTimeEvents({
    'policy-approved': () => loadDashboardData(),
    'policy-declined': () => loadDashboardData(),
    'claimUpdate': () => loadDashboardData(),
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await insurerAPI.getDashboard()
      const dashboard = response.dashboard || response
      
      // Transform API response to match dashboard expectations
      setDashboardData({
        totalPolicies: dashboard.policies?.total || 0,
        approvedPolicies: dashboard.policies?.approved || 0,
        pendingPolicies: dashboard.policies?.pending || 0,
        declinedPolicies: dashboard.policies?.declined || 0,
        policiesToday: dashboard.policies?.recent || 0,
        totalClaims: dashboard.claims?.total || 0,
        reportedClaims: dashboard.claims?.reported || 0,
        settledClaims: dashboard.claims?.settled || 0,
        deniedClaims: dashboard.claims?.denied || 0,
        claimsToday: dashboard.claims?.recent || 0,
        totalUsers: dashboard.users?.total || 0
      })
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
  const chartData = [
    { name: 'Mon', policies: stats.policiesToday || 0, claims: stats.claimsToday || 0 },
    { name: 'Tue', policies: (stats.policiesToday || 0) + 2, claims: (stats.claimsToday || 0) + 1 },
    { name: 'Wed', policies: (stats.policiesToday || 0) + 4, claims: (stats.claimsToday || 0) + 2 },
    { name: 'Thu', policies: (stats.policiesToday || 0) + 6, claims: (stats.claimsToday || 0) + 3 },
    { name: 'Fri', policies: (stats.policiesToday || 0) + 8, claims: (stats.claimsToday || 0) + 4 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insurer Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage policies, claims, and statements</p>
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
          title="Total Policies"
          value={stats.totalPolicies || 0}
          icon={FileText}
          color="#3b82f6"
          onClick={() => navigate('/policies')}
          subtitle={`${stats.approvedPolicies || 0} approved`}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingPolicies || 0}
          icon={FileText}
          color="#f59e0b"
          onClick={() => navigate('/policies')}
        />
        <StatCard
          title="Total Claims"
          value={stats.totalClaims || 0}
          icon={AlertCircle}
          color="#ef4444"
          onClick={() => navigate('/claims')}
          subtitle={`${stats.reportedClaims || 0} reported`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Policy & Claims Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="policies" fill="#3b82f6" name="Policies" />
              <Bar dataKey="claims" fill="#ef4444" name="Claims" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/policies/add')}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left flex items-center gap-3"
            >
              <Plus className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Create New Policy</p>
                <p className="text-sm text-gray-500">Add a new insurance policy</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/claims')}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">View Claims</p>
                <p className="text-sm text-gray-500">Review and process claims</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/statements')}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left flex items-center gap-3"
            >
              <Receipt className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Generate Statement</p>
                <p className="text-sm text-gray-500">Create policy statements</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InsurerDashboard
