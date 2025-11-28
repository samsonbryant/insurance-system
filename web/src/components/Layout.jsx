import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'

const Layout = ({ children, menuItems = [] }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      toast.error('Error logging out')
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-5 w-5" />
      case 'cbl':
        return <Shield className="h-5 w-5" />
      case 'insurer':
        return <Building2 className="h-5 w-5" />
      case 'insured':
        return <User className="h-5 w-5" />
      case 'company':
        return <Building2 className="h-5 w-5" />
      case 'officer':
        return <Shield className="h-5 w-5" />
      default:
        return <LayoutDashboard className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary-600">IVAS</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } hidden lg:block bg-white border-r border-gray-200 fixed h-screen transition-all duration-300 z-30`}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
              {sidebarOpen && (
                <h1 className="text-xl font-bold text-primary-600">IVAS</h1>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </nav>

            {/* User section */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  {getRoleIcon(user?.role)}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                  </div>
                )}
              </div>
              <Link
                to="/profile"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 mb-2 ${
                  !sidebarOpen && 'justify-center'
                }`}
              >
                <User className="h-5 w-5" />
                {sidebarOpen && <span className="text-sm">Profile</span>}
              </Link>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 ${
                  !sidebarOpen && 'justify-center'
                }`}
              >
                <LogOut className="h-5 w-5" />
                {sidebarOpen && <span className="text-sm">Logout</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl">
              <div className="h-full flex flex-col">
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
                  <h1 className="text-xl font-bold text-primary-600">IVAS</h1>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto py-4">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {item.icon && <item.icon className="h-5 w-5" />}
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                      {getRoleIcon(user?.role)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 mb-2"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm">Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300`}>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default Layout

