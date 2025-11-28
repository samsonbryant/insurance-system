import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cblAPI } from '../../services/api'
import { useRealTime, useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import { Building2, FileCheck, Shield, TrendingUp, RefreshCw, Wifi, WifiOff } from 'lucide-react'

const CBLDashboard = () => {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isConnected } = useRealTime()

  useRealTimeEvents({
    'companyStatusUpdate': () => loadDashboardData(),
    'newVerification': () => loadDashboardData(),
    'systemAlert': () => loadDashboardData(),
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await cblAPI.getDashboard()
      const dashboard = response.dashboard || response
      
      // Transform API response to match dashboard expectations
      setDashboardData({
        totalCompanies: dashboard.companies?.total || 0,
        approvedCompanies: dashboard.companies?.approved || 0,
        pendingCompanies: dashboard.companies?.pending || 0,
        suspendedCompanies: dashboard.companies?.suspended || 0,
        pendingApprovals: dashboard.approvals?.pending || 0,
        referenceChecks: dashboard.reference_checks || 0,
        recentApprovals: dashboard.recent_approvals || []
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CBL Dashboard</h1>
          <p className="text-gray-600 mt-1">Central Bank of Liberia - Regulatory Oversight</p>
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
          title="Total Companies"
          value={stats.totalCompanies || 0}
          icon={Building2}
          color="#3b82f6"
          onClick={() => navigate('/companies')}
          subtitle={`${stats.pendingApprovals || 0} pending`}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals || 0}
          icon={FileCheck}
          color="#f59e0b"
          onClick={() => navigate('/approvals')}
        />
        <StatCard
          title="Reference Checks"
          value={stats.referenceChecks || 0}
          icon={TrendingUp}
          color="#8b5cf6"
          subtitle="This month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Approvals</h2>
          <div className="space-y-3">
            {stats.recentApprovals?.length > 0 ? (
              stats.recentApprovals.slice(0, 5).map((approval, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{approval.entity_type}</p>
                    <p className="text-sm text-gray-500">{approval.status}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    approval.status === 'approved' ? 'bg-green-100 text-green-700' :
                    approval.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {approval.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent approvals</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/companies')}
              className="w-full p-3 text-left border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <Building2 className="h-5 w-5 text-primary-600 inline mr-2" />
              <span className="font-medium">Review Company Applications</span>
            </button>
            <button
              onClick={() => navigate('/approvals')}
              className="w-full p-3 text-left border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <FileCheck className="h-5 w-5 text-primary-600 inline mr-2" />
              <span className="font-medium">Process Approvals</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CBLDashboard
