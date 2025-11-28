import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cblAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { Eye, CheckCircle, XCircle, Ban } from 'lucide-react'

const CBLCompanies = () => {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [filteredCompanies, setFilteredCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useRealTimeEvents({
    'companyStatusUpdate': () => loadCompanies(),
  })

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    filterCompanies()
  }, [companies, searchQuery])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const response = await cblAPI.getCompanies({ limit: 100 })
      // Handle different response structures
      if (response.companies) {
        setCompanies(Array.isArray(response.companies) ? response.companies : [])
      } else if (Array.isArray(response)) {
        setCompanies(response)
      } else {
        setCompanies([])
      }
    } catch (error) {
      console.error('Error loading companies:', error)
      toast.error('Failed to load companies')
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  const filterCompanies = () => {
    if (!searchQuery.trim()) {
      setFilteredCompanies(companies)
      return
    }
    const filtered = companies.filter(company =>
      company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.license_number?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredCompanies(filtered)
  }

  const handleApprove = async (companyId) => {
    try {
      await cblAPI.approveCompany(companyId, 'Approved by CBL')
      toast.success('Company approved successfully')
      loadCompanies()
    } catch (error) {
      toast.error('Failed to approve company')
    }
  }

  const handleSuspend = async (companyId) => {
    const reason = prompt('Enter suspension reason:')
    if (!reason) return
    try {
      await cblAPI.suspendCompany(companyId, reason, 30)
      toast.success('Company suspended successfully')
      loadCompanies()
    } catch (error) {
      toast.error('Failed to suspend company')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      suspended: { color: 'bg-red-100 text-red-700', label: 'Suspended' },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const columns = [
    {
      header: 'Company',
      accessor: 'name',
      render: (company) => (
        <div>
          <div className="font-medium text-gray-900">{company.name}</div>
          <div className="text-sm text-gray-500">{company.contact_email}</div>
        </div>
      ),
    },
    {
      header: 'License',
      accessor: 'license_number',
      render: (company) => (
        <div className="text-sm text-gray-900">{company.license_number || '-'}</div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (company) => getStatusBadge(company.status),
    },
    {
      header: 'Date',
      accessor: 'created_at',
      render: (company) => (
        <div className="text-sm text-gray-500">
          {company.created_at ? new Date(company.created_at).toLocaleDateString() : '-'}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      title="Companies Management"
      data={filteredCompanies}
      columns={columns}
      loading={loading}
      onRefresh={loadCompanies}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      emptyMessage="No companies found"
      renderRowActions={(company) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => navigate(`/companies/${company.id}`)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          {company.status === 'pending' && (
            <button
              onClick={() => handleApprove(company.id)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
              title="Approve"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          {company.status === 'approved' && (
            <button
              onClick={() => handleSuspend(company.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Suspend"
            >
              <Ban className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    />
  )
}

export default CBLCompanies
