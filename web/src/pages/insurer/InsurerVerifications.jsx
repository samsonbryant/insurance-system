import React, { useState, useEffect } from 'react'
import { verificationAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import DataTable from '../../components/DataTable'
import { Shield, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

const InsurerVerifications = () => {
  const [verifications, setVerifications] = useState([])
  const [filteredVerifications, setFilteredVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    policy_number: '',
    date_from: '',
    date_to: '',
  })

  // Real-time updates
  useRealTimeEvents({
    newVerification: (data) => {
      toast.info(`New verification: ${data.policy_number}`, { duration: 3000 })
      loadVerifications()
    },
    verificationUpdate: (data) => {
      loadVerifications()
    },
    fake_detected: (data) => {
      toast.error(`Fake policy detected: ${data.policy_number}`, { duration: 5000 })
      loadVerifications()
    },
  })

  const loadVerifications = async () => {
    try {
      setLoading(true)
      const params = {
        limit: 100,
        ...filters,
      }
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key]
      })

      const response = await verificationAPI.getVerifications(params)
      setVerifications(response.verifications || [])
    } catch (error) {
      console.error('Error loading verifications:', error)
      toast.error('Failed to load verifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVerifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.policy_number, filters.date_from, filters.date_to])

  useEffect(() => {
    filterVerifications()
  }, [verifications, filters])

  const filterVerifications = () => {
    let filtered = [...verifications]

    if (filters.policy_number) {
      filtered = filtered.filter(v => 
        v.policy_number?.toLowerCase().includes(filters.policy_number.toLowerCase())
      )
    }

    if (filters.date_from) {
      filtered = filtered.filter(v => {
        const date = new Date(v.created_at)
        return date >= new Date(filters.date_from)
      })
    }

    if (filters.date_to) {
      filtered = filtered.filter(v => {
        const date = new Date(v.created_at)
        const toDate = new Date(filters.date_to)
        toDate.setHours(23, 59, 59, 999)
        return date <= toDate
      })
    }

    setFilteredVerifications(filtered)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'expired':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'fake':
      case 'not_found':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Shield className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      valid: 'bg-green-100 text-green-800',
      expired: 'bg-yellow-100 text-yellow-800',
      fake: 'bg-red-100 text-red-800',
      not_found: 'bg-gray-100 text-gray-800',
      pending: 'bg-blue-100 text-blue-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      render: (row) => `#${row.id}`,
    },
    {
      header: 'Policy Number',
      accessor: 'policy_number',
      render: (row) => <div className="font-medium">{row.policy_number}</div>,
    },
    {
      header: 'Holder Name',
      accessor: 'holder_name',
      render: (row) => <div className="font-medium">{row.holder_name}</div>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row.status)}
          {getStatusBadge(row.status)}
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: 'location',
      render: (row) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="truncate max-w-xs">{row.location || 'Unknown'}</span>
        </div>
      ),
    },
    {
      header: 'Method',
      accessor: 'verification_method',
      render: (row) => (
        <span className="capitalize">{row.verification_method || 'manual'}</span>
      ),
    },
    {
      header: 'Confidence',
      accessor: 'confidence_score',
      render: (row) => (
        <span className="font-medium">{row.confidence_score || 0}%</span>
      ),
    },
    {
      header: 'Verified At',
      accessor: 'verified_at',
      render: (row) => (
        <div className="text-sm text-gray-600">
          {row.verified_at
            ? new Date(row.verified_at).toLocaleString()
            : '-'}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="valid">Valid</option>
              <option value="expired">Expired</option>
              <option value="fake">Fake</option>
              <option value="not_found">Not Found</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="label">Policy Number</label>
            <input
              type="text"
              className="input"
              placeholder="Search policy number"
              value={filters.policy_number}
              onChange={(e) => setFilters({ ...filters, policy_number: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Date From</label>
            <input
              type="date"
              className="input"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Date To</label>
            <input
              type="date"
              className="input"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Verifications Table */}
      <DataTable
        title="Verification Logs"
        data={filteredVerifications}
        columns={columns}
        loading={loading}
        onRefresh={loadVerifications}
        emptyMessage="No verifications found"
      />
    </div>
  )
}

export default InsurerVerifications

