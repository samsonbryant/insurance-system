import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { verificationAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react'

const VerificationHistory = () => {
  const navigate = useNavigate()
  const [verifications, setVerifications] = useState([])
  const [filteredVerifications, setFilteredVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useRealTimeEvents({
    'verificationUpdate': () => loadVerifications(),
    'newVerification': () => loadVerifications(),
  })

  useEffect(() => {
    loadVerifications()
  }, [])

  useEffect(() => {
    filterVerifications()
  }, [verifications, searchQuery])

  const loadVerifications = async () => {
    try {
      setLoading(true)
      const response = await verificationAPI.getVerifications({ limit: 100 })
      setVerifications(response.verifications || response || [])
    } catch (error) {
      console.error('Error loading verifications:', error)
      toast.error('Failed to load verifications')
    } finally {
      setLoading(false)
    }
  }

  const filterVerifications = () => {
    if (!searchQuery.trim()) {
      setFilteredVerifications(verifications)
      return
    }
    const filtered = verifications.filter(verification =>
      verification.policy_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.holder_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.status?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredVerifications(filtered)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      valid: { color: 'bg-green-100 text-green-700', label: 'Valid', icon: CheckCircle },
      fake: { color: 'bg-red-100 text-red-700', label: 'Fake', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending', icon: Clock },
    }
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
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
      render: (verification) => (
        <div className="font-medium text-gray-900">{verification.policy_number || '-'}</div>
      ),
    },
    {
      header: 'Holder',
      accessor: 'holder_name',
      render: (verification) => (
        <div>
          <div className="font-medium text-gray-900">{verification.holder_name || '-'}</div>
          {verification.holder_id_number && (
            <div className="text-sm text-gray-500">ID: {verification.holder_id_number}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (verification) => getStatusBadge(verification.status),
    },
    {
      header: 'Purpose',
      accessor: 'verification_purpose',
      render: (verification) => (
        <div className="text-sm text-gray-600">
          {verification.verification_purpose || '-'}
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'created_at',
      render: (verification) => (
        <div className="text-sm text-gray-500">
          {verification.created_at ? new Date(verification.created_at).toLocaleString() : '-'}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      title="Verification History"
      data={filteredVerifications}
      columns={columns}
      loading={loading}
      onRefresh={loadVerifications}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      emptyMessage="No verifications found"
      renderRowActions={(verification) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => navigate(`/verifications/${verification.id}`)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )}
    />
  )
}

export default VerificationHistory
