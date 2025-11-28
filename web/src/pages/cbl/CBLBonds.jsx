import React, { useState, useEffect } from 'react'
import { cblAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { Shield } from 'lucide-react'

const CBLBonds = () => {
  const [bonds, setBonds] = useState([])
  const [filteredBonds, setFilteredBonds] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useRealTimeEvents({
    'bondUpdate': () => loadBonds(),
  })

  useEffect(() => {
    loadBonds()
  }, [])

  useEffect(() => {
    filterBonds()
  }, [bonds, searchQuery])

  const loadBonds = async () => {
    try {
      setLoading(true)
      const response = await cblAPI.getBonds({ limit: 100 })
      // Handle different response structures
      if (response.bonds) {
        setBonds(Array.isArray(response.bonds) ? response.bonds : [])
      } else if (Array.isArray(response)) {
        setBonds(response)
      } else {
        setBonds([])
      }
    } catch (error) {
      console.error('Error loading bonds:', error)
      toast.error('Failed to load bonds')
      setBonds([])
    } finally {
      setLoading(false)
    }
  }

  const filterBonds = () => {
    if (!searchQuery.trim()) {
      setFilteredBonds(bonds)
      return
    }
    const filtered = bonds.filter(bond =>
      bond.id?.toString().includes(searchQuery) ||
      bond.bond_type?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredBonds(filtered)
  }

  const columns = [
    {
      header: 'Bond ID',
      accessor: 'id',
      render: (bond) => <div className="font-medium text-gray-900">#{bond.id}</div>,
    },
    {
      header: 'Bond Type',
      accessor: 'bond_type',
      render: (bond) => (
        <div className="font-medium text-gray-900">{bond.bond_type || '-'}</div>
      ),
    },
    {
      header: 'Value',
      accessor: 'value',
      render: (bond) => (
        <div className="font-medium text-gray-900">
          ${bond.value?.toLocaleString() || '0'}
        </div>
      ),
    },
    {
      header: 'Policy ID',
      accessor: 'policy_id',
      render: (bond) => (
        <div className="text-sm text-gray-600">{bond.policy_id || '-'}</div>
      ),
    },
    {
      header: 'Date',
      accessor: 'created_at',
      render: (bond) => (
        <div className="text-sm text-gray-500">
          {bond.created_at ? new Date(bond.created_at).toLocaleDateString() : '-'}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      title="Bonds Management"
      data={filteredBonds}
      columns={columns}
      loading={loading}
      onRefresh={loadBonds}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      emptyMessage="No bonds found"
    />
  )
}

export default CBLBonds
