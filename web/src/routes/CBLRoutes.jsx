import { Routes, Route } from 'react-router-dom'
import Layout from '../components/Layout'
import {
  LayoutDashboard,
  Building2,
  Shield,
  FileCheck,
  BarChart3,
} from 'lucide-react'
import CBLDashboard from '../pages/cbl/CBLDashboard'
import CBLCompanies from '../pages/cbl/CBLCompanies'
import CBLApprovals from '../pages/cbl/CBLApprovals'
import CBLReports from '../pages/cbl/CBLReports'
import Profile from '../pages/common/Profile'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/companies', label: 'Companies', icon: Building2 },
  { path: '/approvals', label: 'Approvals', icon: FileCheck },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
]

const CBLRoutes = () => {
  return (
    <Layout menuItems={menuItems}>
      <Routes>
        <Route path="/" element={<CBLDashboard />} />
        <Route path="/companies" element={<CBLCompanies />} />
        <Route path="/companies/:id" element={<CBLCompanies />} />
        <Route path="/approvals" element={<CBLApprovals />} />
        <Route path="/reports" element={<CBLReports />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  )
}

export default CBLRoutes

