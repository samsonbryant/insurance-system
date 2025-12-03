import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { insurerAPI } from '../../services/api'
import { useRealTimeEvents, useRealTime } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import { BarChart3, RefreshCw, Download, FileText, AlertCircle, Shield, Send, Eye, Plus, Calendar, Filter, Printer, Wifi, WifiOff } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { exportToPDF, exportToExcel, printTable } from '../../utils/exportUtils'
import { INSURANCE_TYPES } from '../../utils/insuranceTypes'

const COVERAGE_TYPES = [
  { value: 'treaty', label: 'Treaty' },
  { value: 'facultative', label: 'Facultative' },
  { value: 'co_insured', label: 'Co-Insured' },
]

const InsurerReports = () => {
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'cbl', 'reinsurance'
  const { isConnected } = useRealTime()
  
  // CBL Reports state
  const [cblReports, setCblReports] = useState([])
  const [showCBLForm, setShowCBLForm] = useState(false)
  const [cblReportForm, setCblReportForm] = useState({
    title: '',
    period_start: '',
    period_end: '',
    description: '',
    data: {}
  })
  
  // Reinsurance Report state
  const [reinsuranceData, setReinsuranceData] = useState([])
  const [reinsuranceFilters, setReinsuranceFilters] = useState({
    date_from: '',
    date_to: '',
    coverage_type: ''
  })

  const loadReports = useCallback(async () => {
    try {
      setLoading(true)
      const response = await insurerAPI.getReportsSummary()
      console.log('Reports response:', response)
      // Handle different response structures
      if (response.summary) {
        setReportData(response.summary)
      } else if (response.success && response.summary) {
        setReportData(response.summary)
      } else {
        setReportData(response)
      }
    } catch (error) {
      console.error('Error loading reports:', error)
      console.error('Error details:', error.response?.data)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCBLReports = useCallback(async () => {
    try {
      const response = await insurerAPI.getCBLReports()
      setCblReports(response.reports || [])
    } catch (error) {
      console.error('Error loading CBL reports:', error)
      // Only show error if it's not a 404 (endpoint might not be fully implemented)
      if (error.response?.status !== 404) {
        toast.error('Failed to load CBL reports')
      }
      setCblReports([]) // Set empty array on error
    }
  }, [])

  const loadReinsuranceReport = useCallback(async () => {
    try {
      setLoading(true)
      // Only make request if we have at least one filter or it's the initial load
      const hasFilters = reinsuranceFilters.date_from || reinsuranceFilters.date_to || reinsuranceFilters.coverage_type
      
      if (!hasFilters && reinsuranceData.length > 0) {
        // Don't reload if no filters and we already have data
        setLoading(false)
        return
      }

      const params = {}
      if (reinsuranceFilters.date_from) params.date_from = reinsuranceFilters.date_from
      if (reinsuranceFilters.date_to) params.date_to = reinsuranceFilters.date_to
      if (reinsuranceFilters.coverage_type) params.coverage_type = reinsuranceFilters.coverage_type

      const response = await insurerAPI.getReinsuranceReport(params)
      setReinsuranceData(response.data || [])
    } catch (error) {
      console.error('Error loading reinsurance report:', error)
      // Only show error if it's not a 404 (might be expected if no data)
      if (error.response?.status !== 404) {
        toast.error('Failed to load reinsurance report')
      }
      setReinsuranceData([])
    } finally {
      setLoading(false)
    }
  }, [reinsuranceFilters, reinsuranceData.length])

  // Real-time updates for all report sections
  const handleRealTimeUpdate = useCallback(() => {
    loadReports()
    if (activeTab === 'reinsurance') {
      loadReinsuranceReport()
    }
  }, [activeTab, loadReports, loadReinsuranceReport])

  useRealTimeEvents({
    'policyUpdate': handleRealTimeUpdate,
    'claimUpdate': handleRealTimeUpdate,
    'policy-approved': handleRealTimeUpdate,
    'policy-declined': handleRealTimeUpdate,
    'verificationUpdate': handleRealTimeUpdate,
  })

  useEffect(() => {
    loadReports()
    if (activeTab === 'cbl') {
      loadCBLReports()
    }
  }, [loadReports, activeTab, loadCBLReports])

  useEffect(() => {
    if (activeTab === 'cbl') {
      loadCBLReports()
    }
    if (activeTab === 'reinsurance') {
      loadReinsuranceReport()
    }
  }, [activeTab, loadReinsuranceReport, loadCBLReports])

  useEffect(() => {
    if (activeTab === 'reinsurance') {
      loadReinsuranceReport()
    }
  }, [reinsuranceFilters, activeTab, loadReinsuranceReport])

  // Extract stats from different possible response structures
  const stats = reportData?.summary || reportData || {}
  const chartData = useMemo(() => [
    { name: 'Policies', value: stats.totalPolicies || stats.policies?.total || 0 },
    { name: 'Claims', value: stats.totalClaims || stats.claims?.total || 0 },
  ], [stats])

  const handleCreateCBLReport = async () => {
    try {
      setLoading(true)
      await insurerAPI.createCBLReport(cblReportForm)
      toast.success('CBL Report created and sent successfully')
      setShowCBLForm(false)
      setCblReportForm({
        title: '',
        period_start: '',
        period_end: '',
        description: '',
        data: {}
      })
      loadCBLReports()
    } catch (error) {
      console.error('Error creating CBL report:', error)
      toast.error(error.response?.data?.error || 'Failed to create CBL report')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReinsurancePDF = () => {
    const columns = [
      { header: 'Policy No.', accessor: 'policy_number' },
      { header: 'Insured', accessor: 'holder_name' },
      { header: 'Coverage Type', accessor: 'coverage_type' },
      { header: 'Reinsurance No.', accessor: 'reinsurance_number' },
      { header: 'Date', accessor: 'date' },
    ]
    exportToPDF(
      reinsuranceData,
      columns,
      `Reinsurance Report - ${reinsuranceFilters.coverage_type || 'All Types'}`,
      `reinsurance-report-${new Date().toISOString().split('T')[0]}.pdf`
    )
    toast.success('PDF exported successfully')
  }

  const handleExportReinsuranceExcel = () => {
    const columns = [
      { header: 'Policy No.', accessor: 'policy_number' },
      { header: 'Insured', accessor: 'holder_name' },
      { header: 'Coverage Type', accessor: 'coverage_type' },
      { header: 'Reinsurance No.', accessor: 'reinsurance_number' },
      { header: 'Date', accessor: 'date' },
    ]
    exportToExcel(
      reinsuranceData,
      columns,
      'Reinsurance',
      `reinsurance-report-${new Date().toISOString().split('T')[0]}.xlsx`
    )
    toast.success('Excel exported successfully')
  }

  const handlePrintReinsurance = () => {
    const columns = [
      { header: 'Policy No.', accessor: 'policy_number' },
      { header: 'Insured', accessor: 'holder_name' },
      { header: 'Coverage Type', accessor: 'coverage_type' },
      { header: 'Reinsurance No.', accessor: 'reinsurance_number' },
      { header: 'Date', accessor: 'date' },
    ]
    printTable(reinsuranceData, columns, `Reinsurance Report - ${reinsuranceFilters.coverage_type || 'All Types'}`)
  }

  if (loading && activeTab === 'overview') {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('cbl')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cbl'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            CBL Reports
          </button>
          <button
            onClick={() => setActiveTab('reinsurance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reinsurance'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reinsurance Report
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Policies</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPolicies || stats.policies?.total || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Claims</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalClaims || stats.claims?.total || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
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
        </>
      )}

      {/* CBL Reports Tab */}
      {activeTab === 'cbl' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">CBL Reports</h2>
            <button
              onClick={() => setShowCBLForm(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Report
            </button>
          </div>

          {showCBLForm && (
            <div className="card space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New CBL Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Report Title *</label>
                  <input
                    type="text"
                    className="input"
                    value={cblReportForm.title}
                    onChange={(e) => setCblReportForm({ ...cblReportForm, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Period Start *</label>
                  <input
                    type="date"
                    className="input"
                    value={cblReportForm.period_start}
                    onChange={(e) => setCblReportForm({ ...cblReportForm, period_start: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Period End *</label>
                  <input
                    type="date"
                    className="input"
                    value={cblReportForm.period_end}
                    onChange={(e) => setCblReportForm({ ...cblReportForm, period_end: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea
                  className="input"
                  rows="4"
                  value={cblReportForm.description}
                  onChange={(e) => setCblReportForm({ ...cblReportForm, description: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateCBLReport}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send to CBL
                </button>
                <button
                  onClick={() => {
                    setShowCBLForm(false)
                    setCblReportForm({
                      title: '',
                      period_start: '',
                      period_end: '',
                      description: '',
                      data: {}
                    })
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Reports Sent to CBL</h3>
            {cblReports.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reports sent yet</p>
            ) : (
              <div className="space-y-4">
                {cblReports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{report.title}</h4>
                      <p className="text-sm text-gray-500">
                        {report.period_start} to {report.period_end}
                      </p>
                      <p className="text-sm text-gray-500">
                        Sent: {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => toast.info('View report details')}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reinsurance Report Tab */}
      {activeTab === 'reinsurance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Reinsurance Report</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportReinsurancePDF}
                className="btn btn-secondary flex items-center gap-2"
                disabled={reinsuranceData.length === 0}
              >
                <FileText className="h-4 w-4" />
                PDF
              </button>
              <button
                onClick={handleExportReinsuranceExcel}
                className="btn btn-secondary flex items-center gap-2"
                disabled={reinsuranceData.length === 0}
              >
                <Download className="h-4 w-4" />
                Excel
              </button>
              <button
                onClick={handlePrintReinsurance}
                className="btn btn-secondary flex items-center gap-2"
                disabled={reinsuranceData.length === 0}
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs text-gray-600 mb-1 block">Date From</label>
                <input
                  type="date"
                  className="input"
                  value={reinsuranceFilters.date_from}
                  onChange={(e) => setReinsuranceFilters({ ...reinsuranceFilters, date_from: e.target.value })}
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs text-gray-600 mb-1 block">Date To</label>
                <input
                  type="date"
                  className="input"
                  value={reinsuranceFilters.date_to}
                  onChange={(e) => setReinsuranceFilters({ ...reinsuranceFilters, date_to: e.target.value })}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-600 mb-1 block">Type</label>
                <select
                  className="input"
                  value={reinsuranceFilters.coverage_type}
                  onChange={(e) => setReinsuranceFilters({ ...reinsuranceFilters, coverage_type: e.target.value })}
                >
                  <option value="">All Types</option>
                  {COVERAGE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            {reinsuranceData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reinsurance data found for the selected filters</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Policy No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Insured
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coverage Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reinsurance No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reinsuranceData.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.policy_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.holder_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {COVERAGE_TYPES.find(t => t.value === item.coverage_type)?.label || item.coverage_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.reinsurance_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default InsurerReports
