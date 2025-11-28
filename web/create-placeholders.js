// Script to create placeholder pages
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pages = [
  // Admin pages
  { dir: 'admin', file: 'AdminUsers.jsx', title: 'Users Management' },
  { dir: 'admin', file: 'AdminCompanies.jsx', title: 'Companies Management' },
  { dir: 'admin', file: 'AdminReports.jsx', title: 'Reports' },
  { dir: 'admin', file: 'AdminSettings.jsx', title: 'Settings' },
  { dir: 'admin', file: 'AddUser.jsx', title: 'Add User' },
  { dir: 'admin', file: 'EditUser.jsx', title: 'Edit User' },
  { dir: 'admin', file: 'CompanyDetail.jsx', title: 'Company Details' },
  
  // CBL pages
  { dir: 'cbl', file: 'CBLDashboard.jsx', title: 'CBL Dashboard' },
  { dir: 'cbl', file: 'CBLCompanies.jsx', title: 'Companies' },
  { dir: 'cbl', file: 'CBLApprovals.jsx', title: 'Approvals' },
  { dir: 'cbl', file: 'CBLBonds.jsx', title: 'Bonds' },
  { dir: 'cbl', file: 'CBLReports.jsx', title: 'Reports' },
  
  // Insurer pages
  { dir: 'insurer', file: 'InsurerDashboard.jsx', title: 'Insurer Dashboard' },
  { dir: 'insurer', file: 'InsurerPolicies.jsx', title: 'Policies' },
  { dir: 'insurer', file: 'InsurerClaims.jsx', title: 'Claims' },
  { dir: 'insurer', file: 'InsurerStatements.jsx', title: 'Statements' },
  { dir: 'insurer', file: 'InsurerBonds.jsx', title: 'Bonds' },
  { dir: 'insurer', file: 'InsurerReports.jsx', title: 'Reports' },
  { dir: 'insurer', file: 'AddPolicy.jsx', title: 'Add Policy' },
  { dir: 'insurer', file: 'EditPolicy.jsx', title: 'Edit Policy' },
  
  // Insured pages
  { dir: 'insured', file: 'InsuredDashboard.jsx', title: 'Insured Dashboard' },
  { dir: 'insured', file: 'InsuredPolicies.jsx', title: 'My Policies' },
  { dir: 'insured', file: 'InsuredClaims.jsx', title: 'Claims' },
  { dir: 'insured', file: 'InsuredStatements.jsx', title: 'Statements' },
  { dir: 'insured', file: 'InsuredHistory.jsx', title: 'History' },
  
  // Company pages
  { dir: 'company', file: 'CompanyDashboard.jsx', title: 'Company Dashboard' },
  { dir: 'company', file: 'CompanyPolicies.jsx', title: 'Policies' },
  { dir: 'company', file: 'CompanyReports.jsx', title: 'Reports' },
  { dir: 'company', file: 'AddPolicy.jsx', title: 'Add Policy' },
  { dir: 'company', file: 'EditPolicy.jsx', title: 'Edit Policy' },
  
  // Officer pages
  { dir: 'officer', file: 'OfficerDashboard.jsx', title: 'Officer Dashboard' },
  { dir: 'officer', file: 'VerifyDocument.jsx', title: 'Verify Document' },
  { dir: 'officer', file: 'VerificationHistory.jsx', title: 'Verification History' },
  { dir: 'officer', file: 'OfficerReports.jsx', title: 'Reports' },
  { dir: 'officer', file: 'QRScanner.jsx', title: 'QR Scanner' },
  { dir: 'officer', file: 'VerificationDetail.jsx', title: 'Verification Details' },
]

const template = (title) => `import React from 'react'

const ${title.replace(/\s+/g, '')} = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">${title}</h1>
      <div className="card">
        <p className="text-gray-600">This page is under development. Full functionality coming soon.</p>
      </div>
    </div>
  )
}

export default ${title.replace(/\s+/g, '')}
`

pages.forEach(({ dir, file, title }) => {
  const dirPath = path.join(__dirname, 'src', 'pages', dir)
  const filePath = path.join(dirPath, file)
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
  
  if (!fs.existsSync(filePath)) {
    const componentName = file.replace('.jsx', '')
    fs.writeFileSync(filePath, template(componentName))
    console.log(`Created: ${filePath}`)
  }
})

console.log('Placeholder pages created!')

