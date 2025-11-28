import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Settings as SettingsIcon, Save, Bell, Shield, Database } from 'lucide-react'

const AdminSettings = () => {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    auditLogging: true,
    twoFactorAuth: false,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900">Enable Notifications</span>
                <p className="text-sm text-gray-500">Receive real-time notifications</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900">Email Alerts</span>
                <p className="text-sm text-gray-500">Receive email notifications</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailAlerts}
                onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900">Two-Factor Authentication</span>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <input
                type="checkbox"
                checked={settings.twoFactorAuth}
                onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">System</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900">Audit Logging</span>
                <p className="text-sm text-gray-500">Track all system activities</p>
              </div>
              <input
                type="checkbox"
                checked={settings.auditLogging}
                onChange={(e) => setSettings({ ...settings, auditLogging: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="btn btn-primary flex items-center gap-2"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
