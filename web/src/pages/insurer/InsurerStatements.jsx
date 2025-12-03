import React, { useState, useEffect } from 'react'
import { insurerAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { Download, FileText, Printer, Filter } from 'lucide-react'
import { exportToPDF, exportToExcel, printTable } from '../../utils/exportUtils'
import { INSURANCE_TYPES, getInsuranceTypeLabel } from '../../utils/insuranceTypes'

const COVERAGE_TYPES = [
  { value: 'treaty', label: 'Treaty' },
  { value: 'facultative', label: 'Facultative' },
  { value: 'co_insured', label: 'Co-Insured' },
]

const InsurerStatements = () => {
  const [statements, setStatements] = useState([])
  const [filteredStatements, setFilteredStatements] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    policy_type: '',
    coverage_type: ''
  })

  useRealTimeEvents({
    'statementUpdate': () => loadStatements(),
  })

  useEffect(() => {
    loadStatements()
  }, [])

  useEffect(() => {
    filterStatements()
  }, [statements, searchQuery, filters])

  const loadStatements = async () => {
    try {
      setLoading(true)
      const response = await insurerAPI.getStatements({ limit: 100 })
      setStatements(response.statements || response || [])
    } catch (error) {
      console.error('Error loading statements:', error)
      toast.error('Failed to load statements')
    } finally {
      setLoading(false)
    }
  }

  const filterStatements = () => {
    let filtered = [...statements]
    
    // Apply search query filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(statement =>
        statement.policy?.policy_number?.toString().includes(searchQuery) ||
        statement.policy?.holder_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        statement.id?.toString().includes(searchQuery)
      )
    }
    
    // Apply policy type filter
    if (filters.policy_type) {
      filtered = filtered.filter(statement =>
        statement.policy?.policy_type === filters.policy_type
      )
    }
    
    // Apply coverage type filter
    if (filters.coverage_type) {
      filtered = filtered.filter(statement => {
        const coverage = statement.policy?.coverage_type || statement.policy?.coverage_amount
        return coverage === filters.coverage_type
      })
    }
    
    setFilteredStatements(filtered)
  }

  const handleExportPDF = () => {
    exportToPDF(
      filteredStatements,
      columns,
      'Statements Report',
      `statements-report-${new Date().toISOString().split('T')[0]}.pdf`
    )
    toast.success('PDF exported successfully')
  }

  const handleExportExcel = () => {
    exportToExcel(
      filteredStatements,
      columns,
      'Statements',
      `statements-report-${new Date().toISOString().split('T')[0]}.xlsx`
    )
    toast.success('Excel exported successfully')
  }

  const handlePrint = () => {
    printTable(filteredStatements, columns, 'Statements Report')
  }

  const columns = [
    {
      header: 'Insured',
      accessor: 'policy.holder_name',
      render: (statement) => (
        <div className="text-gray-900">
          {statement.policy?.holder_name || '-'}
        </div>
      ),
    },
    {
      header: 'Policy No.',
      accessor: 'policy.policy_number',
      render: (statement) => (
        <div className="font-medium text-gray-900">
          {statement.policy?.policy_number || statement.policy_id || '-'}
        </div>
      ),
    },
    {
      header: 'Policy Type',
      accessor: 'policy.policy_type',
      render: (statement) => (
        <div className="text-sm text-gray-600">
          {statement.policy?.policy_type ? getInsuranceTypeLabel(statement.policy.policy_type) : '-'}
        </div>
      ),
    },
    {
      header: 'Coverage',
      accessor: 'policy.coverage_type',
      render: (statement) => {
        const coverage = statement.policy?.coverage_type || statement.policy?.coverage_amount
        return (
          <div className="text-sm text-gray-600">
            {coverage ? (COVERAGE_TYPES.find(t => t.value === coverage)?.label || coverage) : '-'}
          </div>
        )
      },
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (statement) => (
        <div className="text-sm text-gray-600">
          {statement.details_json?.statement_type || 'Standard'}
        </div>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Statements</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="btn btn-secondary flex items-center gap-2"
            disabled={filteredStatements.length === 0}
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="btn btn-secondary flex items-center gap-2"
            disabled={filteredStatements.length === 0}
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-secondary flex items-center gap-2"
            disabled={filteredStatements.length === 0}
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by Policy No., Insured..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="min-w-[200px]">
            <select
              value={filters.policy_type}
              onChange={(e) => setFilters({ ...filters, policy_type: e.target.value })}
              className="input"
            >
              <option value="">All Policy Types</option>
              {INSURANCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px]">
            <select
              value={filters.coverage_type}
              onChange={(e) => setFilters({ ...filters, coverage_type: e.target.value })}
              className="input"
            >
              <option value="">All Coverage Types</option>
              {COVERAGE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          {(filters.policy_type || filters.coverage_type) && (
            <button
              onClick={() => setFilters({ policy_type: '', coverage_type: '' })}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <DataTable
        title=""
        data={filteredStatements}
        columns={columns}
        loading={loading}
        onRefresh={loadStatements}
        searchQuery=""
        onSearchChange={() => {}}
        emptyMessage="No statements found"
        renderRowActions={(statement) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => toast.info('Download functionality coming soon')}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        )}
      />
    </div>
  )
}

export default InsurerStatements
