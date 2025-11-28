import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { verificationAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'

const VerificationDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [verification, setVerification] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVerification()
  }, [id])

  const loadVerification = async () => {
    try {
      setLoading(true)
      const response = await verificationAPI.getVerification(id)
      setVerification(response.verification || response)
    } catch (error) {
      console.error('Error loading verification:', error)
      toast.error('Failed to load verification details')
      navigate('/history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      valid: { color: 'bg-green-100 text-green-700', label: 'Valid', icon: CheckCircle },
      fake: { color: 'bg-red-100 text-red-700', label: 'Fake', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending', icon: Clock },
    }
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
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

  if (!verification) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Verification not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/history')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verification Details</h1>
          <p className="text-gray-600 mt-1">{getStatusBadge(verification.status)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Policy Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Policy Number</label>
              <p className="text-gray-900">{verification.policy_number || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Holder Name</label>
              <p className="text-gray-900">{verification.holder_name || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Holder ID Number</label>
              <p className="text-gray-900">{verification.holder_id_number || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Verification Purpose</label>
              <p className="text-gray-900">{verification.verification_purpose || '-'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Details</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">{getStatusBadge(verification.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Verification Date</label>
              <p className="text-gray-900">
                {verification.created_at ? new Date(verification.created_at).toLocaleString() : '-'}
              </p>
            </div>
            {verification.reason && (
              <div>
                <label className="text-sm font-medium text-gray-500">Reason</label>
                <p className="text-gray-900">{verification.reason}</p>
              </div>
            )}
            {verification.officer && (
              <div>
                <label className="text-sm font-medium text-gray-500">Verified By</label>
                <p className="text-gray-900">
                  {verification.officer.first_name} {verification.officer.last_name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerificationDetail
