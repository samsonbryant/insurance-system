import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { companyAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { Eye, CheckCircle, XCircle, Ban } from 'lucide-react'

const AdminCompanies = () => {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [filteredCompanies, setFilteredCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useRealTimeEvents({
    'companyStatusUpdate': () => loadCompanies(),
    'companyCreated': () => loadCompanies(),
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
      const response = await companyAPI.getCompanies({ limit: 100 })
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
      company.license_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.registration_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredCompanies(filtered)
  }

  const handleApprove = async (companyId, status) => {
    try {
      await companyAPI.approveCompany(companyId, status)
      toast.success(`Company ${status} successfully`)
      loadCompanies()
    } catch (error) {
      toast.error(`Failed to ${status} company`)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      suspended: { color: 'bg-red-100 text-red-700', label: 'Suspended' },
      rejected: { color: 'bg-gray-100 text-gray-700', label: 'Rejected' },
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
      header: 'License Number',
      accessor: 'license_number',
      render: (company) => (
        <div>
          <div className="font-medium text-gray-900">{company.license_number || '-'}</div>
          <div className="text-sm text-gray-500">Reg: {company.registration_number || '-'}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (company) => getStatusBadge(company.status),
    },
    {
      header: 'Contact',
      accessor: 'contact',
      render: (company) => (
        <div className="text-sm">
          <div className="text-gray-900">{company.contact_phone || '-'}</div>
          <div className="text-gray-500">{company.address || '-'}</div>
        </div>
      ),
    },
    {
      header: 'Last Sync',
      accessor: 'last_sync',
      render: (company) => (
        <div className="text-sm text-gray-500">
          {company.last_sync
            ? new Date(company.last_sync).toLocaleDateString()
            : 'Never'}
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
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {company.status === 'pending' && (
            <>
              <button
                onClick={() => handleApprove(company.id, 'approved')}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                title="Approve"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleApprove(company.id, 'rejected')}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Reject"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
          {company.status === 'approved' && (
            <button
              onClick={() => handleApprove(company.id, 'suspended')}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
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

export default AdminCompanies
