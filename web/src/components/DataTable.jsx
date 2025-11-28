import React from 'react'
import { Search, Download, RefreshCw, Plus } from 'lucide-react'

const DataTable = ({
  title,
  data = [],
  columns = [],
  loading = false,
  onRefresh,
  onAdd,
  onExport,
  searchQuery,
  onSearchChange,
  actions = [],
  emptyMessage = 'No data available',
  renderRowActions,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          {onSearchChange && (
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="input pl-10"
              />
            </div>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="btn btn-secondary flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New
            </button>
          )}
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`btn ${action.variant || 'btn-secondary'} flex items-center gap-2`}
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col.header}
                    </th>
                  ))}
                  {renderRowActions && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, rowIdx) => (
                  <tr key={row.id || rowIdx} className="hover:bg-gray-50">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                    {renderRowActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {renderRowActions(row)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination info */}
      {data.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {data.length} {data.length === 1 ? 'item' : 'items'}
        </div>
      )}
    </div>
  )
}

export default DataTable

