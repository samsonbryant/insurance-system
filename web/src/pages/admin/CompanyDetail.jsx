import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { companyAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Building2, Mail, Phone, MapPin, CheckCircle, XCircle, Ban } from 'lucide-react'

const CompanyDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompany()
  }, [id])

  const loadCompany = async () => {
    try {
      setLoading(true)
      const response = await companyAPI.getCompany(id)
      setCompany(response.company || response)
    } catch (error) {
      console.error('Error loading company:', error)
      toast.error('Failed to load company details')
      navigate('/companies')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (status) => {
    try {
      await companyAPI.approveCompany(id, status)
      toast.success(`Company ${status} successfully`)
      loadCompany()
    } catch (error) {
      toast.error(`Failed to ${status} company`)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-700', label: 'Approved', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      suspended: { color: 'bg-red-100 text-red-700', label: 'Suspended', icon: Ban },
      rejected: { color: 'bg-gray-100 text-gray-700', label: 'Rejected', icon: XCircle },
    }
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon || Building2
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full ${config.color}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Company not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/companies')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-600 mt-1">{getStatusBadge(company.status)}</p>
          </div>
        </div>
        {company.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove('approved')}
              className="btn btn-success flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() => handleApprove('rejected')}
              className="btn btn-danger flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">License Number</label>
                <p className="text-gray-900">{company.license_number || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Registration Number</label>
                <p className="text-gray-900">{company.registration_number || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">{company.address || '-'}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{company.contact_email || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{company.contact_phone || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(company.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Sync</label>
                <p className="text-gray-900">
                  {company.last_sync
                    ? new Date(company.last_sync).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Sync Status</label>
                <p className="text-gray-900">{company.sync_status || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyDetail
