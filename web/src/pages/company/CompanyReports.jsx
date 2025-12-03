import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { companyAPI, policiesAPI } from '../../services/api'
import { useRealTimeEvents, useRealTime } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import { BarChart3, RefreshCw, FileText, Users, Wifi, WifiOff } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CompanyReports = () => {
  const { user } = useAuth()
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isConnected } = useRealTime()

  const loadReports = useCallback(async () => {
    try {
      setLoading(true)
      const companyId = user?.company_id
      if (companyId) {
        const [companyStats, policiesResponse] = await Promise.all([
          companyAPI.getCompanyStats(companyId),
          policiesAPI.getPolicies({ company_id: companyId }),
        ])
        setReportData({
          ...companyStats,
          policies: policiesResponse.policies || policiesResponse || [],
        })
      }
    } catch (error) {
      console.error('Error loading reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [user?.company_id])

  // Real-time event handlers
  const handleRealTimeUpdate = useCallback(() => {
    loadReports()
  }, [loadReports])

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
    loadReports()
  }, [loadReports])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const stats = reportData || {}
  const chartData = useMemo(() => [
    { name: 'Total Policies', value: stats.totalPolicies || 0 },
    { name: 'Active Policies', value: stats.activePolicies || 0 },
    { name: 'Total Users', value: stats.totalUsers || 0 },
  ], [stats.totalPolicies, stats.activePolicies, stats.totalUsers])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          {isConnected ? (
            <Wifi className="h-5 w-5 text-green-500" title="Real-time connected" />
          ) : (
            <WifiOff className="h-5 w-5 text-gray-400" title="Real-time disconnected" />
          )}
        </div>
        <button
          onClick={loadReports}
          className="btn btn-secondary flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Policies</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPolicies || 0}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Policies</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activePolicies || 0}</p>
            </div>
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
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
    </div>
  )
}

export default CompanyReports
