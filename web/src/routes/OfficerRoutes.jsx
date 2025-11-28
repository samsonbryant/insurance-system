import { Routes, Route } from 'react-router-dom'
import Layout from '../components/Layout'
import {
  LayoutDashboard,
  Shield,
  History,
  BarChart3,
  QrCode,
} from 'lucide-react'
import OfficerDashboard from '../pages/officer/OfficerDashboard'
import VerifyDocument from '../pages/officer/VerifyDocument'
import VerificationHistory from '../pages/officer/VerificationHistory'
import OfficerReports from '../pages/officer/OfficerReports'
import QRScanner from '../pages/officer/QRScanner'
import VerificationDetail from '../pages/officer/VerificationDetail'
import Profile from '../pages/common/Profile'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/verify', label: 'Verify Document', icon: Shield },
  { path: '/scanner', label: 'QR Scanner', icon: QrCode },
  { path: '/history', label: 'History', icon: History },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
]

const OfficerRoutes = () => {
  return (
    <Layout menuItems={menuItems}>
      <Routes>
        <Route path="/" element={<OfficerDashboard />} />
        <Route path="/verify" element={<VerifyDocument />} />
        <Route path="/scanner" element={<QRScanner />} />
        <Route path="/history" element={<VerificationHistory />} />
        <Route path="/verifications/:id" element={<VerificationDetail />} />
        <Route path="/reports" element={<OfficerReports />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  )
}

export default OfficerRoutes

