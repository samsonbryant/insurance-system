import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { insurerAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { Eye, Edit, FileText, CheckCircle, XCircle } from 'lucide-react'

const InsurerPolicies = () => {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState([])
  const [filteredPolicies, setFilteredPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useRealTimeEvents({
    'policy-approved': () => loadPolicies(),
    'policy-declined': () => loadPolicies(),
    'policyUpdate': () => loadPolicies(),
  })

  useEffect(() => {
    loadPolicies()
  }, [])

  useEffect(() => {
    filterPolicies()
  }, [policies, searchQuery])

  const loadPolicies = async () => {
    try {
      setLoading(true)
      const response = await insurerAPI.getPolicies({ limit: 100 })
      // Handle different response structures
      if (response.policies) {
        setPolicies(Array.isArray(response.policies) ? response.policies : [])
      } else if (Array.isArray(response)) {
        setPolicies(response)
      } else {
        setPolicies([])
      }
    } catch (error) {
      console.error('Error loading policies:', error)
      toast.error('Failed to load policies')
      setPolicies([])
    } finally {
      setLoading(false)
    }
  }

  const filterPolicies = () => {
    if (!searchQuery.trim()) {
      setFilteredPolicies(policies)
      return
    }

    const filtered = policies.filter(policy =>
      policy.policy_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.holder_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.policy_type?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredPolicies(filtered)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-700', label: 'Approved', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      declined: { color: 'bg-red-100 text-red-700', label: 'Declined', icon: XCircle },
      active: { color: 'bg-blue-100 text-blue-700', label: 'Active' },
    }
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon || FileText
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  const columns = [
    {
      header: 'Policy Number',
      accessor: 'policy_number',
      render: (policy) => (
        <div>
          <div className="font-medium text-gray-900">{policy.policy_number || '-'}</div>
          <div className="text-sm text-gray-500">{policy.policy_type || '-'}</div>
        </div>
      ),
    },
    {
      header: 'Holder',
      accessor: 'holder_name',
      render: (policy) => (
        <div>
          <div className="font-medium text-gray-900">{policy.holder_name || '-'}</div>
          {policy.holder_email && (
            <div className="text-sm text-gray-500">{policy.holder_email}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Coverage',
      accessor: 'coverage_amount',
      render: (policy) => (
        <div>
          <div className="font-medium text-gray-900">
            ${policy.coverage_amount?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-gray-500">
            Premium: ${policy.premium_amount?.toLocaleString() || '0'}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (policy) => getStatusBadge(policy.approval_status || policy.status),
    },
    {
      header: 'Dates',
      accessor: 'dates',
      render: (policy) => (
        <div className="text-sm">
          <div className="text-gray-900">
            Start: {policy.start_date ? new Date(policy.start_date).toLocaleDateString() : '-'}
          </div>
          <div className="text-gray-500">
            Expiry: {policy.expiry_date ? new Date(policy.expiry_date).toLocaleDateString() : '-'}
          </div>
        </div>
      ),
    },
  ]

  return (
    <DataTable
      title="Policies"
      data={filteredPolicies}
      columns={columns}
      loading={loading}
      onRefresh={loadPolicies}
      onAdd={() => navigate('/policies/add')}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      emptyMessage="No policies found"
      renderRowActions={(policy) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => navigate(`/policies/${policy.id}`)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate(`/policies/edit/${policy.id}`)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      )}
    />
  )
}

export default InsurerPolicies
