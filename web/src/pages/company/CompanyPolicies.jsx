import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { policiesAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { Eye, Edit, Trash2 } from 'lucide-react'

const CompanyPolicies = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [policies, setPolicies] = useState([])
  const [filteredPolicies, setFilteredPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useRealTimeEvents({
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
      const response = await policiesAPI.getPolicies({
        company_id: user?.company_id,
        limit: 100,
      })
      setPolicies(response.policies || response || [])
    } catch (error) {
      console.error('Error loading policies:', error)
      toast.error('Failed to load policies')
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

  const handleDelete = async (policyId) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return
    try {
      await policiesAPI.deletePolicy(policyId)
      toast.success('Policy deleted successfully')
      loadPolicies()
    } catch (error) {
      toast.error('Failed to delete policy')
    }
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
      render: (policy) => (
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          policy.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {policy.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Dates',
      accessor: 'dates',
      render: (policy) => (
        <div className="text-sm">
          <div className="text-gray-900">
            {policy.start_date ? new Date(policy.start_date).toLocaleDateString() : '-'}
          </div>
          <div className="text-gray-500">
            to {policy.expiry_date ? new Date(policy.expiry_date).toLocaleDateString() : '-'}
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
          <button
            onClick={() => handleDelete(policy.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    />
  )
}

export default CompanyPolicies
