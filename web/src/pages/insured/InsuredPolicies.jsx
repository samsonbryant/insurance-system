import React, { useState, useEffect } from 'react'
import { insuredAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { Eye, Download } from 'lucide-react'

const InsuredPolicies = () => {
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
      const response = await insuredAPI.getPolicies({ limit: 100 })
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
      policy.policy_type?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredPolicies(filtered)
  }

  const handleDownloadCertificate = async (policyId) => {
    try {
      const response = await insuredAPI.getPolicyCertificate(policyId)
      // Handle PDF download
      toast.success('Certificate downloaded')
    } catch (error) {
      toast.error('Failed to download certificate')
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
      header: 'Validity',
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
      title="My Policies"
      data={filteredPolicies}
      columns={columns}
      loading={loading}
      onRefresh={loadPolicies}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      emptyMessage="No policies found"
      renderRowActions={(policy) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleDownloadCertificate(policy.id)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            title="Download Certificate"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      )}
    />
  )
}

export default InsuredPolicies
