import React, { useState, useEffect } from 'react'
import { cblAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { CheckCircle, XCircle } from 'lucide-react'

const CBLApprovals = () => {
  const [approvals, setApprovals] = useState([])
  const [filteredApprovals, setFilteredApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useRealTimeEvents({
    'approvalUpdate': () => loadApprovals(),
  })

  useEffect(() => {
    loadApprovals()
  }, [])

  useEffect(() => {
    filterApprovals()
  }, [approvals, searchQuery])

  const loadApprovals = async () => {
    try {
      setLoading(true)
      const response = await cblAPI.getApprovals({ limit: 100 })
      // Handle different response structures
      if (response.approvals) {
        setApprovals(Array.isArray(response.approvals) ? response.approvals : [])
      } else if (Array.isArray(response)) {
        setApprovals(response)
      } else {
        setApprovals([])
      }
    } catch (error) {
      console.error('Error loading approvals:', error)
      toast.error('Failed to load approvals')
      setApprovals([])
    } finally {
      setLoading(false)
    }
  }

  const filterApprovals = () => {
    if (!searchQuery.trim()) {
      setFilteredApprovals(approvals)
      return
    }
    const filtered = approvals.filter(approval =>
      approval.entity_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.status?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredApprovals(filtered)
  }

  const handleApprove = async (approvalId) => {
    const notes = prompt('Enter approval notes:')
    if (!notes) return
    try {
      await cblAPI.approveRequest(approvalId, notes)
      toast.success('Request approved successfully')
      loadApprovals()
    } catch (error) {
      toast.error('Failed to approve request')
    }
  }

  const handleDecline = async (approvalId) => {
    const reason = prompt('Enter decline reason:')
    if (!reason) return
    try {
      await cblAPI.declineRequest(approvalId, reason)
      toast.success('Request declined')
      loadApprovals()
    } catch (error) {
      toast.error('Failed to decline request')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      declined: { color: 'bg-red-100 text-red-700', label: 'Declined' },
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
      header: 'Entity Type',
      accessor: 'entity_type',
      render: (approval) => (
        <div className="font-medium text-gray-900">{approval.entity_type || '-'}</div>
      ),
    },
    {
      header: 'Entity ID',
      accessor: 'entity_id',
      render: (approval) => (
        <div className="text-gray-900">#{approval.entity_id}</div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (approval) => getStatusBadge(approval.status),
    },
    {
      header: 'Date',
      accessor: 'created_at',
      render: (approval) => (
        <div className="text-sm text-gray-500">
          {approval.created_at ? new Date(approval.created_at).toLocaleDateString() : '-'}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      title="Approvals Management"
      data={filteredApprovals}
      columns={columns}
      loading={loading}
      onRefresh={loadApprovals}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      emptyMessage="No approvals found"
      renderRowActions={(approval) => (
        <div className="flex items-center justify-end gap-2">
          {approval.status === 'pending' && (
            <>
              <button
                onClick={() => handleApprove(approval.id)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                title="Approve"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDecline(approval.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Decline"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}
    />
  )
}

export default CBLApprovals
