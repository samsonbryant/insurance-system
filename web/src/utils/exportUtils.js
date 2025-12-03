import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

/**
 * Export data to PDF
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions with header and accessor
 * @param {String} title - Title of the document
 * @param {String} filename - Filename for download
 */
export const exportToPDF = (data, columns, title, filename = 'export.pdf') => {
  const doc = new jsPDF()
  
  // Add title
  doc.setFontSize(16)
  doc.text(title, 14, 15)
  
  // Add date
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22)
  
  // Prepare table data
  const tableData = data.map(row => 
    columns.map(col => {
      const value = col.accessor ? row[col.accessor] : (col.render ? col.render(row) : '')
      return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value || '')
    })
  )
  
  const headers = columns.map(col => col.header)
  
  // Add table
  doc.autoTable({
    head: [headers],
    body: tableData,
    startY: 28,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }, // Blue color
    alternateRowStyles: { fillColor: [249, 250, 251] }
  })
  
  // Save PDF
  doc.save(filename)
}

/**
 * Export data to Excel
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions with header and accessor
 * @param {String} title - Title of the sheet
 * @param {String} filename - Filename for download
 */
export const exportToExcel = (data, columns, title, filename = 'export.xlsx') => {
  // Prepare data
  const headers = columns.map(col => col.header)
  const rows = data.map(row => 
    columns.map(col => {
      const value = col.accessor ? row[col.accessor] : (col.render ? col.render(row) : '')
      // Extract text from React elements or return plain value
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value)
      }
      return String(value || '')
    })
  )
  
  // Create workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  
  // Set column widths
  const colWidths = columns.map(() => ({ wch: 20 }))
  ws['!cols'] = colWidths
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, title || 'Sheet1')
  
  // Save file
  XLSX.writeFile(wb, filename)
}

/**
 * Print data as table
 * @param {Array} data - Array of objects to print
 * @param {Array} columns - Column definitions with header and accessor
 * @param {String} title - Title of the document
 */
export const printTable = (data, columns, title = 'Report') => {
  const printWindow = window.open('', '_blank')
  
  const headers = columns.map(col => col.header).join('</th><th>')
  const rows = data.map(row => {
    const cells = columns.map(col => {
      const value = col.accessor ? row[col.accessor] : (col.render ? col.render(row) : '')
      // Extract text from React elements or return plain value
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value)
      }
      return String(value || '')
    }).join('</td><td>')
    return `<tr><td>${cells}</td></tr>`
  }).join('')
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #3b82f6; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          @media print {
            body { margin: 0; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
        <table>
          <thead>
            <tr><th>${headers}</th></tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `)
  
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

/**
 * Generate unique holder ID
 * Format: HLD-YYYYMMDD-HHMMSS-XXXX
 */
export const generateHolderID = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  
  return `HLD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`
}

