import React, { useState, useEffect } from 'react'
import { insuredAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { Download } from 'lucide-react'

const InsuredStatements = () => {
  const [statements, setStatements] = useState([])
  const [filteredStatements, setFilteredStatements] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useRealTimeEvents({
    'statementUpdate': () => loadStatements(),
  })

  useEffect(() => {
    loadStatements()
  }, [])

  useEffect(() => {
    filterStatements()
  }, [statements, searchQuery])

  const loadStatements = async () => {
    try {
      setLoading(true)
      const response = await insuredAPI.getStatements({ limit: 100 })
      setStatements(response.statements || response || [])
    } catch (error) {
      console.error('Error loading statements:', error)
      toast.error('Failed to load statements')
    } finally {
      setLoading(false)
    }
  }

  const filterStatements = () => {
    if (!searchQuery.trim()) {
      setFilteredStatements(statements)
      return
    }
    const filtered = statements.filter(statement =>
      statement.id?.toString().includes(searchQuery) ||
      statement.policy_id?.toString().includes(searchQuery)
    )
    setFilteredStatements(filtered)
  }

  const handleDownload = async (statementId) => {
    try {
      const blob = await insuredAPI.downloadStatement(statementId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `statement_${statementId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Statement downloaded successfully')
    } catch (error) {
      toast.error('Failed to download statement')
    }
  }

  const columns = [
    {
      header: 'Statement ID',
      accessor: 'id',
      render: (statement) => (
        <div className="font-medium text-gray-900">#{statement.id}</div>
      ),
    },
    {
      header: 'Policy ID',
      accessor: 'policy_id',
      render: (statement) => (
        <div className="text-gray-900">{statement.policy_id || '-'}</div>
      ),
    },
    {
      header: 'Date',
      accessor: 'created_at',
      render: (statement) => (
        <div className="text-sm text-gray-500">
          {statement.created_at ? new Date(statement.created_at).toLocaleDateString() : '-'}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      title="My Statements"
      data={filteredStatements}
      columns={columns}
      loading={loading}
      onRefresh={loadStatements}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      emptyMessage="No statements found"
      renderRowActions={(statement) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleDownload(statement.id)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      )}
    />
  )
}

export default InsuredStatements
