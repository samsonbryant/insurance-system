import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { insurerAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { Eye, CheckCircle, XCircle, Download, FileText, Printer, Filter } from 'lucide-react'
import { exportToPDF, exportToExcel, printTable } from '../../utils/exportUtils'
import { INSURANCE_TYPES, getInsuranceTypeLabel } from '../../utils/insuranceTypes'

const InsurerClaims = () => {
  const navigate = useNavigate()
  const [claims, setClaims] = useState([])
  const [filteredClaims, setFilteredClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [policyTypeFilter, setPolicyTypeFilter] = useState('')

  useRealTimeEvents({
    'claimUpdate': () => loadClaims(),
  })

  useEffect(() => {
    loadClaims()
  }, [])

  useEffect(() => {
    filterClaims()
  }, [claims, searchQuery, policyTypeFilter])

  const loadClaims = async () => {
    try {
      setLoading(true)
      const response = await insurerAPI.getClaims({ limit: 100 })
      // Handle different response structures
      if (response.claims) {
        setClaims(Array.isArray(response.claims) ? response.claims : [])
      } else if (Array.isArray(response)) {
        setClaims(response)
      } else {
        setClaims([])
      }
    } catch (error) {
      console.error('Error loading claims:', error)
      toast.error('Failed to load claims')
      setClaims([])
    } finally {
      setLoading(false)
    }
  }

  const filterClaims = () => {
    let filtered = [...claims]
    
    // Apply search query filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(claim =>
        claim.policy?.policy_number?.toString().includes(searchQuery) ||
        claim.policy?.holder_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.id?.toString().includes(searchQuery)
      )
    }
    
    // Apply policy type filter
    if (policyTypeFilter) {
      filtered = filtered.filter(claim =>
        claim.policy?.policy_type === policyTypeFilter
      )
    }
    
    setFilteredClaims(filtered)
  }

  const handleSettle = async (claimId) => {
    const amount = prompt('Enter settlement amount:')
    if (!amount) return
    try {
      await insurerAPI.settleClaim(claimId, parseFloat(amount), 'Settled by insurer')
      toast.success('Claim settled successfully')
      loadClaims()
    } catch (error) {
      toast.error('Failed to settle claim')
    }
  }

  const handleDeny = async (claimId) => {
    const reason = prompt('Enter denial reason:')
    if (!reason) return
    try {
      await insurerAPI.denyClaim(claimId, reason)
      toast.success('Claim denied')
      loadClaims()
    } catch (error) {
      toast.error('Failed to deny claim')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      reported: { color: 'bg-yellow-100 text-yellow-700', label: 'Reported' },
      settled: { color: 'bg-green-100 text-green-700', label: 'Settled' },
      denied: { color: 'bg-red-100 text-red-700', label: 'Denied' },
      processing: { color: 'bg-blue-100 text-blue-700', label: 'Processing' },
    }
    const config = statusConfig[status] || statusConfig.reported
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const handleExportPDF = () => {
    exportToPDF(
      filteredClaims,
      columns,
      'Claims Management Report',
      `claims-report-${new Date().toISOString().split('T')[0]}.pdf`
    )
    toast.success('PDF exported successfully')
  }

  const handleExportExcel = () => {
    exportToExcel(
      filteredClaims,
      columns,
      'Claims',
      `claims-report-${new Date().toISOString().split('T')[0]}.xlsx`
    )
    toast.success('Excel exported successfully')
  }

  const handlePrint = () => {
    printTable(filteredClaims, columns, 'Claims Management Report')
  }

  const columns = [
    {
      header: 'Policy No.',
      accessor: 'policy.policy_number',
      render: (claim) => (
        <div className="font-medium text-gray-900">
          {claim.policy?.policy_number || '-'}
        </div>
      ),
    },
    {
      header: 'Insured (Policy Holder)',
      accessor: 'policy.holder_name',
      render: (claim) => {
        // Try policy holder name first
        if (claim.policy?.holder_name) {
          return <div className="text-gray-900">{claim.policy.holder_name}</div>
        }
        // Fallback to insured user name if available
        if (claim.insured?.first_name && claim.insured?.last_name) {
          return <div className="text-gray-900">{`${claim.insured.first_name} ${claim.insured.last_name}`}</div>
        }
        // Fallback to insured email if available
        if (claim.insured?.email) {
          return <div className="text-gray-900">{claim.insured.email}</div>
        }
        // Default fallback
        return <div className="text-gray-900">-</div>
      },
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (claim) => (
        <div className="max-w-md">
          <p className="text-gray-900">{claim.description || '-'}</p>
        </div>
      ),
    },
    {
      header: 'Policy Type',
      accessor: 'policy.policy_type',
      render: (claim) => (
        <div className="text-sm text-gray-600">
          {claim.policy?.policy_type ? getInsuranceTypeLabel(claim.policy.policy_type) : '-'}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (claim) => getStatusBadge(claim.status),
    },
    {
      header: 'Date',
      accessor: 'created_at',
      render: (claim) => (
        <div className="text-sm text-gray-500">
          {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : '-'}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="btn btn-secondary flex items-center gap-2"
            disabled={filteredClaims.length === 0}
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="btn btn-secondary flex items-center gap-2"
            disabled={filteredClaims.length === 0}
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-secondary flex items-center gap-2"
            disabled={filteredClaims.length === 0}
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by Policy No., Insured, or Description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="min-w-[200px]">
            <select
              value={policyTypeFilter}
              onChange={(e) => setPolicyTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">All Policy Types</option>
              {INSURANCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          {policyTypeFilter && (
            <button
              onClick={() => setPolicyTypeFilter('')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      <DataTable
        title=""
        data={filteredClaims}
        columns={columns}
        loading={loading}
        onRefresh={loadClaims}
        searchQuery=""
        onSearchChange={() => {}}
        emptyMessage="No claims found"
        renderRowActions={(claim) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => navigate(`/claims/${claim.id}`)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </button>
            {claim.status === 'reported' && (
              <>
                <button
                  onClick={() => handleSettle(claim.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  title="Settle"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeny(claim.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Deny"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )}
      />
    </div>
  )
}

export default InsurerClaims
