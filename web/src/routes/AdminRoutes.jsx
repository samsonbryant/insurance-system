import { Routes, Route } from 'react-router-dom'
import Layout from '../components/Layout'
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  BarChart3,
  Settings,
  Shield,
} from 'lucide-react'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminCompanies from '../pages/admin/AdminCompanies'
import AdminReports from '../pages/admin/AdminReports'
import AdminSettings from '../pages/admin/AdminSettings'
import AdminVerifications from '../pages/admin/AdminVerifications'
import AddUser from '../pages/admin/AddUser'
import EditUser from '../pages/admin/EditUser'
import CompanyDetail from '../pages/admin/CompanyDetail'
import Profile from '../pages/common/Profile'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/companies', label: 'Companies', icon: Building2 },
  { path: '/verifications', label: 'Verifications', icon: Shield },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
]

const AdminRoutes = () => {
  return (
    <Layout menuItems={menuItems}>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/users/add" element={<AddUser />} />
        <Route path="/users/edit/:id" element={<EditUser />} />
        <Route path="/companies" element={<AdminCompanies />} />
        <Route path="/companies/:id" element={<CompanyDetail />} />
        <Route path="/verifications" element={<AdminVerifications />} />
        <Route path="/reports" element={<AdminReports />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  )
}

export default AdminRoutes

