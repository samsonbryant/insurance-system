import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { verificationAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

const VerifyDocument = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    policy_number: '',
    holder_name: '',
    holder_id_number: '',
    verification_purpose: '',
  })
  const [verificationResult, setVerificationResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await verificationAPI.verifyDocument({
        policy_number: formData.policy_number,
        holder_name: formData.holder_name,
        holder_id_number: formData.holder_id_number,
        verification_purpose: formData.verification_purpose,
      })
      setVerificationResult(response)
      toast.success('Verification completed')
    } catch (error) {
      console.error('Error verifying document:', error)
      toast.error(error.response?.data?.error || 'Failed to verify document')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      policy_number: '',
      holder_name: '',
      holder_id_number: '',
      verification_purpose: '',
    })
    setVerificationResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Verify Document</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Policy Number *</label>
            <input
              type="text"
              className="input"
              value={formData.policy_number}
              onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
              required
              placeholder="Enter policy number"
            />
          </div>

          <div>
            <label className="label">Holder Name *</label>
            <input
              type="text"
              className="input"
              value={formData.holder_name}
              onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
              required
              placeholder="Enter holder name"
            />
          </div>

          <div>
            <label className="label">Holder ID Number *</label>
            <input
              type="text"
              className="input"
              value={formData.holder_id_number}
              onChange={(e) => setFormData({ ...formData, holder_id_number: e.target.value })}
              required
              placeholder="Enter ID number"
            />
          </div>

          <div>
            <label className="label">Verification Purpose *</label>
            <select
              className="input"
              value={formData.verification_purpose}
              onChange={(e) => setFormData({ ...formData, verification_purpose: e.target.value })}
              required
            >
              <option value="">Select purpose</option>
              <option value="traffic_stop">Traffic Stop</option>
              <option value="accident_report">Accident Report</option>
              <option value="compliance_check">Compliance Check</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2"
            disabled={loading}
          >
            <Shield className="h-4 w-4" />
            {loading ? 'Verifying...' : 'Verify Document'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </form>

      {verificationResult && (
        <div className={`card border-l-4 ${
          verificationResult.status === 'valid'
            ? 'border-green-500 bg-green-50'
            : verificationResult.status === 'fake'
            ? 'border-red-500 bg-red-50'
            : 'border-yellow-500 bg-yellow-50'
        }`}>
          <div className="flex items-start gap-4">
            {verificationResult.status === 'valid' ? (
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
            ) : verificationResult.status === 'fake' ? (
              <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
            ) : (
              <Shield className="h-8 w-8 text-yellow-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Verification {verificationResult.status === 'valid' ? 'Valid' : verificationResult.status === 'fake' ? 'Invalid' : 'Pending'}
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Policy Number:</span> {verificationResult.policy_number || formData.policy_number}</p>
                <p><span className="font-medium">Holder:</span> {verificationResult.holder_name || formData.holder_name}</p>
                {verificationResult.reason && (
                  <p><span className="font-medium">Reason:</span> {verificationResult.reason}</p>
                )}
                {verificationResult.verification && (
                  <p><span className="font-medium">Verification ID:</span> {verificationResult.verification.id}</p>
                )}
              </div>
              <button
                onClick={() => navigate(`/verifications/${verificationResult.verification?.id || verificationResult.id}`)}
                className="mt-4 btn btn-primary"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VerifyDocument
