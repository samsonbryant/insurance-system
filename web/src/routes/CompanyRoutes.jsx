import { Routes, Route } from 'react-router-dom'
import Layout from '../components/Layout'
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react'
import CompanyDashboard from '../pages/company/CompanyDashboard'
import CompanyPolicies from '../pages/company/CompanyPolicies'
import CompanyReports from '../pages/company/CompanyReports'
import AddPolicy from '../pages/company/AddPolicy'
import EditPolicy from '../pages/company/EditPolicy'
import Profile from '../pages/common/Profile'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/policies', label: 'Policies', icon: FileText },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
]

const CompanyRoutes = () => {
  return (
    <Layout menuItems={menuItems}>
      <Routes>
        <Route path="/" element={<CompanyDashboard />} />
        <Route path="/policies" element={<CompanyPolicies />} />
        <Route path="/policies/add" element={<AddPolicy />} />
        <Route path="/policies/edit/:id" element={<EditPolicy />} />
        <Route path="/policies/:id" element={<CompanyPolicies />} />
        <Route path="/reports" element={<CompanyReports />} />
        <Route path="/settings" element={<CompanyReports />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  )
}

export default CompanyRoutes

