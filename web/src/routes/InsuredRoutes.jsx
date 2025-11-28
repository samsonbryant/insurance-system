import { Routes, Route } from 'react-router-dom'
import Layout from '../components/Layout'
import {
  LayoutDashboard,
  FileText,
  AlertCircle,
  Receipt,
  History,
} from 'lucide-react'
import InsuredDashboard from '../pages/insured/InsuredDashboard'
import InsuredPolicies from '../pages/insured/InsuredPolicies'
import InsuredClaims from '../pages/insured/InsuredClaims'
import InsuredStatements from '../pages/insured/InsuredStatements'
import InsuredHistory from '../pages/insured/InsuredHistory'
import Profile from '../pages/common/Profile'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/policies', label: 'My Policies', icon: FileText },
  { path: '/claims', label: 'Claims', icon: AlertCircle },
  { path: '/statements', label: 'Statements', icon: Receipt },
  { path: '/history', label: 'History', icon: History },
]

const InsuredRoutes = () => {
  return (
    <Layout menuItems={menuItems}>
      <Routes>
        <Route path="/" element={<InsuredDashboard />} />
        <Route path="/policies" element={<InsuredPolicies />} />
        <Route path="/policies/:id" element={<InsuredPolicies />} />
        <Route path="/claims" element={<InsuredClaims />} />
        <Route path="/claims/:id" element={<InsuredClaims />} />
        <Route path="/claims/report" element={<InsuredClaims />} />
        <Route path="/statements" element={<InsuredStatements />} />
        <Route path="/history" element={<InsuredHistory />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  )
}

export default InsuredRoutes

