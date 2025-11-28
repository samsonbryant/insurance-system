import { Routes, Route } from 'react-router-dom'
import Layout from '../components/Layout'
import {
  LayoutDashboard,
  FileText,
  AlertCircle,
  Receipt,
  Shield,
  BarChart3,
  Search,
} from 'lucide-react'
import InsurerDashboard from '../pages/insurer/InsurerDashboard'
import InsurerPolicies from '../pages/insurer/InsurerPolicies'
import InsurerClaims from '../pages/insurer/InsurerClaims'
import InsurerStatements from '../pages/insurer/InsurerStatements'
import InsurerReports from '../pages/insurer/InsurerReports'
import InsurerVerifications from '../pages/insurer/InsurerVerifications'
import AddPolicy from '../pages/insurer/AddPolicy'
import EditPolicy from '../pages/insurer/EditPolicy'
import Profile from '../pages/common/Profile'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/policies', label: 'Policies', icon: FileText },
  { path: '/claims', label: 'Claims', icon: AlertCircle },
  { path: '/statements', label: 'Statements', icon: Receipt },
  { path: '/verifications', label: 'Verifications', icon: Search },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
]

const InsurerRoutes = () => {
  return (
    <Layout menuItems={menuItems}>
      <Routes>
        <Route path="/" element={<InsurerDashboard />} />
        <Route path="/policies" element={<InsurerPolicies />} />
        <Route path="/policies/add" element={<AddPolicy />} />
        <Route path="/policies/edit/:id" element={<EditPolicy />} />
        <Route path="/policies/:id" element={<InsurerPolicies />} />
        <Route path="/claims" element={<InsurerClaims />} />
        <Route path="/claims/:id" element={<InsurerClaims />} />
        <Route path="/statements" element={<InsurerStatements />} />
        <Route path="/verifications" element={<InsurerVerifications />} />
        <Route path="/reports" element={<InsurerReports />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  )
}

export default InsurerRoutes

