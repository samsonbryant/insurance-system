import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { insuredAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { Eye, CheckCircle, XCircle } from 'lucide-react'

const InsuredHistory = () => {
  const [history, setHistory] = useState([])
  const [filteredHistory, setFilteredHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true)
      const response = await insuredAPI.getVerificationHistory({ limit: 100 })
      setHistory(response.verifications || response || [])
    } catch (error) {
      console.error('Error loading history:', error)
      toast.error('Failed to load verification history')
    } finally {
      setLoading(false)
    }
  }, [])

  const filterHistory = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history)
      return
    }
    const filtered = history.filter(item =>
      item.policy_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredHistory(filtered)
  }, [history, searchQuery])

  const events = useMemo(() => ({
    'verificationUpdate': loadHistory,
  }), [loadHistory])

  useRealTimeEvents(events)

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    filterHistory()
  }, [filterHistory])

  const getStatusBadge = (status) => {
    const statusConfig = {
      valid: { color: 'bg-green-100 text-green-700', label: 'Valid', icon: CheckCircle },
      fake: { color: 'bg-red-100 text-red-700', label: 'Invalid', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
    }
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${config.color}`}>
        {Icon && <Icon className="h-3 w-3" />}
        {config.label}
      </span>
    )
  }

  const columns = [
    {
      header: 'Policy Number',
      accessor: 'policy_number',
      render: (item) => (
        <div className="font-medium text-gray-900">{item.policy_number || '-'}</div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => getStatusBadge(item.status),
    },
    {
      header: 'Purpose',
      accessor: 'verification_purpose',
      render: (item) => (
        <div className="text-sm text-gray-600">
          {item.verification_purpose || '-'}
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'created_at',
      render: (item) => (
        <div className="text-sm text-gray-500">
          {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      title="Verification History"
      data={filteredHistory}
      columns={columns}
      loading={loading}
      onRefresh={loadHistory}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      emptyMessage="No verification history found"
      renderRowActions={(item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => toast.info('View details coming soon')}
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

export default InsuredHistory
