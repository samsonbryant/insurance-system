import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { companyAPI, policiesAPI } from '../../services/api'
import { useRealTime, useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import { FileText, BarChart3, RefreshCw, Wifi, WifiOff, Plus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CompanyDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isConnected } = useRealTime()

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const companyId = user?.company_id
      if (companyId) {
        const [companyStats, policiesResponse] = await Promise.all([
          companyAPI.getCompanyStats(companyId),
          policiesAPI.getPolicies({ company_id: companyId, limit: 10 }),
        ])
        setDashboardData({
          ...companyStats,
          recentPolicies: policiesResponse.policies || policiesResponse || [],
        })
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user?.company_id])

  // Real-time event handlers
  const handleRealTimeUpdate = useCallback(() => {
    loadDashboardData()
  }, [loadDashboardData])

  useRealTimeEvents({
    'policyUpdate': handleRealTimeUpdate,
    'policy-approved': handleRealTimeUpdate,
    'policy-declined': handleRealTimeUpdate,
    'verificationUpdate': handleRealTimeUpdate,
    'new_verification': handleRealTimeUpdate,
    'claimUpdate': handleRealTimeUpdate,
    'companyStatusUpdate': handleRealTimeUpdate,
  })

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

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
  const chartData = useMemo(() => [
    { name: 'Total Policies', value: stats.totalPolicies || 0 },
    { name: 'Active Policies', value: stats.activePolicies || 0 },
    { name: 'Policies This Month', value: stats.policiesThisMonth || 0 },
    { name: 'Total Users', value: stats.totalUsers || 0 },
  ], [stats.totalPolicies, stats.activePolicies, stats.policiesThisMonth, stats.totalUsers])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your policies and operations</p>
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
          subtitle={`${stats.activePolicies || 0} active`}
        />
        <StatCard
          title="Policies This Month"
          value={stats.policiesThisMonth || 0}
          icon={FileText}
          color="#10b981"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={BarChart3}
          color="#f59e0b"
        />
        <StatCard
          title="Sync Status"
          value={stats.lastSync ? 'Synced' : 'Pending'}
          icon={RefreshCw}
          color="#8b5cf6"
          subtitle={stats.lastSync ? new Date(stats.lastSync).toLocaleDateString() : 'Never'}
        />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Policies</h2>
          <button
            onClick={() => navigate('/policies/add')}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Policy
          </button>
        </div>
        <div className="space-y-3">
          {stats.recentPolicies?.length > 0 ? (
            stats.recentPolicies.map((policy, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/policies/${policy.id}`)}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{policy.policy_number}</p>
                    <p className="text-sm text-gray-500">{policy.holder_name} • {policy.policy_type}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    policy.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {policy.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No policies found</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CompanyDashboard
