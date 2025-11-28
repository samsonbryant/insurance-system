import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { insurerAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { Eye, CheckCircle, XCircle } from 'lucide-react'

const InsurerClaims = () => {
  const navigate = useNavigate()
  const [claims, setClaims] = useState([])
  const [filteredClaims, setFilteredClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useRealTimeEvents({
    'claimUpdate': () => loadClaims(),
  })

  useEffect(() => {
    loadClaims()
  }, [])

  useEffect(() => {
    filterClaims()
  }, [claims, searchQuery])

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
    if (!searchQuery.trim()) {
      setFilteredClaims(claims)
      return
    }
    const filtered = claims.filter(claim =>
      claim.id?.toString().includes(searchQuery) ||
      claim.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.status?.toLowerCase().includes(searchQuery.toLowerCase())
    )
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

  const columns = [
    {
      header: 'Claim ID',
      accessor: 'id',
      render: (claim) => <div className="font-medium text-gray-900">#{claim.id}</div>,
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
    <DataTable
      title="Claims Management"
      data={filteredClaims}
      columns={columns}
      loading={loading}
      onRefresh={loadClaims}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
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
  )
}

export default InsurerClaims
